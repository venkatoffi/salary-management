class RestructureSalaryHistoryAndAddPayslips < ActiveRecord::Migration[8.0]
  def up
    add_column :salary_revisions, :user_id, :bigint
    execute <<~SQL.squish
      UPDATE salary_revisions
      SET user_id = salaries.user_id
      FROM salaries
      WHERE salaries.id = salary_revisions.salary_id
    SQL
    change_column_null :salary_revisions, :user_id, false
    add_index :salary_revisions, :user_id
    add_foreign_key :salary_revisions, :users
    remove_reference :salary_revisions, :salary, foreign_key: true

    create_table :payslips do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :month, null: false
      t.integer :year, null: false
      t.decimal :total_earnings, precision: 15, scale: 2, null: false
      t.decimal :total_deduction, precision: 15, scale: 2, null: false
      t.decimal :net_pay, precision: 15, scale: 2, null: false

      t.timestamps
    end
    add_index :payslips, %i[user_id month year], unique: true
    add_check_constraint :payslips, "month BETWEEN 1 AND 12", name: "payslips_month_valid"
    add_check_constraint :payslips, "year >= 1", name: "payslips_year_valid"
    add_check_constraint :payslips, "total_earnings >= 0", name: "payslips_total_earnings_nonnegative"
    add_check_constraint :payslips, "total_deduction >= 0", name: "payslips_total_deduction_nonnegative"
    add_check_constraint :payslips, "net_pay >= 0", name: "payslips_net_pay_nonnegative"
  end

  def down
    drop_table :payslips

    add_reference :salary_revisions, :salary, null: true, foreign_key: true
    execute <<~SQL.squish
      UPDATE salary_revisions
      SET salary_id = salaries.id
      FROM salaries
      WHERE salaries.user_id = salary_revisions.user_id
    SQL
    change_column_null :salary_revisions, :salary_id, false
    remove_foreign_key :salary_revisions, :users, column: :user_id
    remove_index :salary_revisions, :user_id
    remove_column :salary_revisions, :user_id
  end
end

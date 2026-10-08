class CreateSalaryManagementSchema < ActiveRecord::Migration[8.0]
  def change
    create_table :roles do |t|
      t.string :name, null: false
      t.text :description

      t.timestamps
    end
    add_index :roles, :name, unique: true

    create_table :users do |t|
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.string :sex
      t.references :role, null: false, foreign_key: true
      t.string :job_title
      t.string :employee_code, null: false
      t.string :employment_status, null: false
      t.string :country_code, limit: 2, null: false
      t.string :city
      t.date :date_of_joining, null: false
      t.date :last_working_date

      t.timestamps
    end
    add_index :users, :email, unique: true
    add_index :users, :employee_code, unique: true

    create_table :departments do |t|
      t.string :name, null: false
      t.text :description
      t.references :department_head, foreign_key: { to_table: :users }

      t.timestamps
    end
    add_index :departments, :name, unique: true

    add_reference :users, :department, null: false, foreign_key: true

    create_table :salaries do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.string :currency_code, limit: 3, null: false
      t.decimal :current_ctc, precision: 15, scale: 2, null: false
      t.date :effective_from, null: false

      t.timestamps
    end
    add_index :salaries, :user_id, unique: true
    add_check_constraint :salaries, "current_ctc >= 0", name: "salaries_current_ctc_nonnegative"

    create_table :salary_revisions do |t|
      t.references :salary, null: false, foreign_key: true
      t.decimal :old_ctc, precision: 15, scale: 2, null: false
      t.decimal :new_ctc, precision: 15, scale: 2, null: false
      t.date :revision_date, null: false
      t.references :approved_by, null: false, foreign_key: { to_table: :users }
      t.string :reason

      t.timestamps
    end
    add_index :salary_revisions, :revision_date
    add_check_constraint :salary_revisions, "old_ctc >= 0", name: "salary_revisions_old_ctc_nonnegative"
    add_check_constraint :salary_revisions, "new_ctc >= 0", name: "salary_revisions_new_ctc_nonnegative"

    create_table :authentications do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.string :authentication_token, null: false
      t.datetime :last_login_at
      t.datetime :authentication_expires_at
      t.string :status, null: false

      t.timestamps
    end
    add_index :authentications, :user_id, unique: true
    add_index :authentications, :authentication_token, unique: true
    add_index :authentications, :status
    add_index :authentications, :authentication_expires_at
  end
end

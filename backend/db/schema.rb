# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_10_10_201000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "authentications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "authentication_token", null: false
    t.datetime "last_login_at"
    t.datetime "authentication_expires_at"
    t.boolean "status", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["authentication_expires_at"], name: "index_authentications_on_authentication_expires_at"
    t.index ["authentication_token"], name: "index_authentications_on_authentication_token", unique: true
    t.index ["status"], name: "index_authentications_on_status"
    t.index ["user_id"], name: "index_authentications_on_user_id"
  end

  create_table "departments", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.bigint "department_head_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["department_head_id"], name: "index_departments_on_department_head_id"
    t.index ["name"], name: "index_departments_on_name", unique: true
  end

  create_table "payslips", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "month", null: false
    t.integer "year", null: false
    t.decimal "total_earnings", precision: 15, scale: 2, null: false
    t.decimal "total_deduction", precision: 15, scale: 2, null: false
    t.decimal "net_pay", precision: 15, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "month", "year"], name: "index_payslips_on_user_id_and_month_and_year", unique: true
    t.index ["user_id"], name: "index_payslips_on_user_id"
    t.check_constraint "month >= 1 AND month <= 12", name: "payslips_month_valid"
    t.check_constraint "net_pay >= 0::numeric", name: "payslips_net_pay_nonnegative"
    t.check_constraint "total_deduction >= 0::numeric", name: "payslips_total_deduction_nonnegative"
    t.check_constraint "total_earnings >= 0::numeric", name: "payslips_total_earnings_nonnegative"
    t.check_constraint "year >= 1", name: "payslips_year_valid"
  end

  create_table "roles", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_roles_on_name", unique: true
  end

  create_table "salaries", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "currency_code", limit: 3, null: false
    t.decimal "current_ctc", precision: 15, scale: 2, null: false
    t.date "effective_from", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_salaries_on_user_id", unique: true
    t.check_constraint "current_ctc >= 0::numeric", name: "salaries_current_ctc_nonnegative"
  end

  create_table "salary_revisions", force: :cascade do |t|
    t.decimal "old_ctc", precision: 15, scale: 2, null: false
    t.decimal "new_ctc", precision: 15, scale: 2, null: false
    t.date "revision_date", null: false
    t.bigint "approved_by_id", null: false
    t.string "reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["approved_by_id"], name: "index_salary_revisions_on_approved_by_id"
    t.index ["revision_date"], name: "index_salary_revisions_on_revision_date"
    t.index ["user_id"], name: "index_salary_revisions_on_user_id"
    t.check_constraint "new_ctc >= 0::numeric", name: "salary_revisions_new_ctc_nonnegative"
    t.check_constraint "old_ctc >= 0::numeric", name: "salary_revisions_old_ctc_nonnegative"
  end

  create_table "users", force: :cascade do |t|
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "email", null: false
    t.string "sex"
    t.bigint "role_id", null: false
    t.string "job_title"
    t.string "employee_code", null: false
    t.string "employment_status", null: false
    t.string "country_code", limit: 2, null: false
    t.string "city"
    t.date "date_of_joining", null: false
    t.date "last_working_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "department_id", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "state"
    t.index ["department_id"], name: "index_users_on_department_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["employee_code"], name: "index_users_on_employee_code", unique: true
    t.index ["role_id"], name: "index_users_on_role_id"
  end

  add_foreign_key "authentications", "users"
  add_foreign_key "departments", "users", column: "department_head_id"
  add_foreign_key "payslips", "users"
  add_foreign_key "salaries", "users"
  add_foreign_key "salary_revisions", "users"
  add_foreign_key "salary_revisions", "users", column: "approved_by_id"
  add_foreign_key "users", "departments"
  add_foreign_key "users", "roles"
end

# This file is loaded after roles and departments have been seeded.
initial_user_password = ENV.fetch("INITIAL_USER_PASSWORD") do
  raise "Set INITIAL_USER_PASSWORD before seeding in production" if Rails.env.production?

  "SalaryDemo2026!"
end

department_head_role = Role.find_by!(name: "Department Heads") # Currently ID 5.
hr_manager_role = Role.find_by!(name: "HR Manager") # Currently ID 4.
chief_role = Role.find_by!(name: "Chiefs") # Currently ID 3.

department_heads = [
  {
    department_name: "Engineering",
    first_name: "Ananya", last_name: "Rao", email: "ananya.rao@salarymanagement.test",
    sex: "Female", job_title: "Head of Engineering", employee_code: "DH-ENG-001",
    employment_status: "active", country_code: "IN", city: "Bengaluru",
    date_of_joining: Date.new(2018, 4, 9), last_working_date: nil
  },
  {
    department_name: "Human Resources",
    first_name: "Priya", last_name: "Sharma", email: "priya.sharma@salarymanagement.test",
    sex: "Female", job_title: "Head of Human Resources", employee_code: "DH-HR-001",
    employment_status: "active", country_code: "IN", city: "Mumbai",
    date_of_joining: Date.new(2019, 7, 15), last_working_date: nil
  },
  {
    department_name: "Finance",
    first_name: "Karthik", last_name: "Iyer", email: "karthik.iyer@salarymanagement.test",
    sex: "Male", job_title: "Head of Finance", employee_code: "DH-FIN-001",
    employment_status: "active", country_code: "IN", city: "Chennai",
    date_of_joining: Date.new(2017, 1, 23), last_working_date: nil
  },
  {
    department_name: "Sales and Marketing",
    first_name: "Meera", last_name: "Nair", email: "meera.nair@salarymanagement.test",
    sex: "Female", job_title: "Head of Sales and Marketing", employee_code: "DH-SM-001",
    employment_status: "active", country_code: "IN", city: "Kochi",
    date_of_joining: Date.new(2019, 10, 1), last_working_date: nil
  },
  {
    department_name: "Information Technology",
    first_name: "Naveen", last_name: "Kumar", email: "naveen.kumar@salarymanagement.test",
    sex: "Male", job_title: "Head of Information Technology", employee_code: "DH-IT-001",
    employment_status: "active", country_code: "IN", city: "Hyderabad",
    date_of_joining: Date.new(2018, 8, 20), last_working_date: nil
  },
  {
    department_name: "Operations",
    first_name: "Divya", last_name: "Menon", email: "divya.menon@salarymanagement.test",
    sex: "Female", job_title: "Head of Operations", employee_code: "DH-OPS-001",
    employment_status: "active", country_code: "IN", city: "Pune",
    date_of_joining: Date.new(2020, 2, 17), last_working_date: nil
  }
]

department_heads.each do |attributes|
  department = Department.find_by!(name: attributes[:department_name])
  user_attributes = attributes.except(:department_name).merge(
    role_id: department_head_role.id,
    department_id: department.id
  )
  user = User.find_or_initialize_by(email: user_attributes[:email])
  user.password = initial_user_password if user.new_record? || user.encrypted_password.blank?
  user.update!(user_attributes)
  department.update!(department_head: user)
end

executives = [
  {
    first_name: "Arjun", last_name: "Mehta", email: "arjun.mehta@salarymanagement.test",
    sex: "Male", job_title: "Chief Executive Officer", employee_code: "CH-CEO-001",
    employment_status: "active", country_code: "IN", city: "Mumbai",
    date_of_joining: Date.new(2015, 6, 1), last_working_date: nil,
    department_name: "Operations"
  },
  {
    first_name: "Kavya", last_name: "Reddy", email: "kavya.reddy@salarymanagement.test",
    sex: "Female", job_title: "Chief Financial Officer", employee_code: "CH-CFO-001",
    employment_status: "active", country_code: "IN", city: "Chennai",
    date_of_joining: Date.new(2016, 3, 14), last_working_date: nil,
    department_name: "Finance"
  },
  {
    first_name: "Vikram", last_name: "Shah", email: "vikram.shah@salarymanagement.test",
    sex: "Male", job_title: "Chief Technology Officer", employee_code: "CH-CTO-001",
    employment_status: "active", country_code: "IN", city: "Bengaluru",
    date_of_joining: Date.new(2016, 11, 7), last_working_date: nil,
    department_name: "Engineering"
  }
]

executives.each do |attributes|
  user_attributes = attributes.except(:department_name).merge(
    role_id: chief_role.id,
    department_id: Department.find_by!(name: attributes[:department_name]).id
  )
  user = User.find_or_initialize_by(email: user_attributes[:email])
  user.password = initial_user_password if user.new_record? || user.encrypted_password.blank?
  user.update!(user_attributes)
end

hr_manager = {
  first_name: "Aditi", last_name: "Kapoor", email: "aditi.kapoor@salarymanagement.test",
  sex: "Female", job_title: "Human Resources Manager", employee_code: "HRM-001",
  employment_status: "active", country_code: "IN", city: "Mumbai",
  date_of_joining: Date.new(2020, 9, 28), last_working_date: nil,
  role_id: hr_manager_role.id,
  department_id: Department.find_by!(name: "Human Resources").id
}

user = User.find_or_initialize_by(email: hr_manager[:email])
user.password = initial_user_password if user.new_record? || user.encrypted_password.blank?
user.update!(hr_manager)

shared_password_digest = User.new(password: initial_user_password).encrypted_password
User.where(encrypted_password: [ nil, "" ]).update_all(
  encrypted_password: shared_password_digest,
  updated_at: Time.current
)

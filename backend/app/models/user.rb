class User < ApplicationRecord
  devise :database_authenticatable, :validatable

  belongs_to :role
  belongs_to :department

  has_one :salary, dependent: :restrict_with_error
  has_many :authentications, dependent: :destroy
  has_many :salary_revisions, dependent: :restrict_with_error
  has_many :payslips, dependent: :restrict_with_error
  has_many :approved_salary_revisions,
           class_name: "SalaryRevision",
           foreign_key: :approved_by_id,
           inverse_of: :approved_by,
           dependent: :restrict_with_error
  has_many :headed_departments,
           class_name: "Department",
           foreign_key: :department_head_id,
           inverse_of: :department_head,
           dependent: :restrict_with_error
  validates :first_name, :last_name, :email, :employee_code, :employment_status,
            :country_code, :date_of_joining, presence: true
  validates :email, :employee_code, uniqueness: true
  validates :country_code, length: { is: 2 }
end

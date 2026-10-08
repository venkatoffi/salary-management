class Department < ApplicationRecord
  belongs_to :department_head, class_name: "User", optional: true, inverse_of: :headed_departments
  has_many :users, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
end

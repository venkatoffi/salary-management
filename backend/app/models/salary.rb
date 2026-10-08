class Salary < ApplicationRecord
  belongs_to :user
  has_many :salary_revisions, dependent: :restrict_with_error

  validates :currency_code, :effective_from, presence: true
  validates :currency_code, length: { is: 3 }
  validates :current_ctc, numericality: { greater_than_or_equal_to: 0 }
end

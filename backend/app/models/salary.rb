class Salary < ApplicationRecord
  belongs_to :user

  validates :currency_code, :effective_from, presence: true
  validates :user_id, uniqueness: true
  validates :currency_code, length: { is: 3 }
  validates :current_ctc, numericality: { greater_than_or_equal_to: 0 }
end

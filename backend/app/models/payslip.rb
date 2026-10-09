class Payslip < ApplicationRecord
  belongs_to :user

  validates :month, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 12 }
  validates :year, numericality: { only_integer: true, greater_than: 0 }
  validates :total_earnings, :total_deduction, :net_pay,
            numericality: { greater_than_or_equal_to: 0 }
  validates :year, uniqueness: { scope: %i[user_id month] }
end

class SalaryRevision < ApplicationRecord
  belongs_to :salary
  belongs_to :approved_by, class_name: "User", inverse_of: :approved_salary_revisions

  validates :old_ctc, :new_ctc, :revision_date, presence: true
  validates :old_ctc, :new_ctc, numericality: { greater_than_or_equal_to: 0 }

  def increment_percentage
    return 0 if old_ctc.zero?

    ((new_ctc - old_ctc) / old_ctc * 100).round(2)
  end
end

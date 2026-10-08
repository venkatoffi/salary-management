class Authentication < ApplicationRecord
  belongs_to :user

  validates :authentication_token, :status, presence: true
  validates :authentication_token, uniqueness: true
  validates :status, inclusion: { in: %w[active expired revoked] }
end

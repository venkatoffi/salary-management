class Authentication < ApplicationRecord
  belongs_to :user

  validates :authentication_token, :last_login_at, :authentication_expires_at, presence: true
  validates :authentication_token, uniqueness: true
  validates :status, inclusion: { in: [ true, false ] }

  scope :active, -> { where(status: true).where("authentication_expires_at > ?", Time.current) }
end

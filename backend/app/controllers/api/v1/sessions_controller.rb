class Api::V1::SessionsController < Api::V1::BaseController
  skip_before_action :authenticate_api_user!, only: :create

  def create
    credentials = params[:user] || params
    user = User.find_for_database_authentication(email: credentials[:email].to_s.strip)

    unless user&.valid_password?(credentials[:password].to_s)
      return render json: { error: "Invalid email or password" }, status: :unauthorized
    end

    now = Time.current
    expires_at = now + Api::V1::JwtToken::LIFETIME
    token = nil
    user.with_lock do
      user.authentications.create!(
        authentication_token: SecureRandom.hex(32),
        last_login_at: now,
        authentication_expires_at: expires_at,
        status: true
      ).tap do |authentication|
        token = Api::V1::JwtToken.encode(user: user, authentication: authentication, issued_at: now)
        authentication.update!(authentication_token: Digest::SHA256.hexdigest(token))
      end
    end

    render json: {
      auth_token: token,
      expires_at: expires_at.iso8601,
      user: Api::V1::CurrentUserPayload.call(user)
    }, status: :ok
  end

  def destroy
    current_authentication.update!(status: false)
    head :no_content
  end
end

class Api::V1::JwtToken
  ALGORITHM = "HS256"
  LIFETIME = 24.hours

  def self.encode(
    user:,
    authentication:,
    issued_at: Time.current,
    expires_at: authentication.authentication_expires_at
  )
    payload = {
      sub: user.id.to_s,
      role_id: user.role_id,
      department_id: user.department_id,
      authentication_id: authentication.id,
      iat: issued_at.to_i,
      exp: expires_at.to_i
    }

    JWT.encode(payload, secret, ALGORITHM)
  end

  def self.decode(token)
    payload, = JWT.decode(token, secret, true, algorithm: ALGORITHM, verify_expiration: true)
    payload
  end

  def self.secret
    secret = ENV["JWT_SECRET_KEY"].presence ||
             Rails.application.credentials.jwt_secret_key
    raise "Configure JWT_SECRET_KEY or credentials.jwt_secret_key" if secret.blank?
    raise "JWT signing secret must be at least 32 bytes" if secret.to_s.bytesize < 32

    secret
  end
  private_class_method :secret
end

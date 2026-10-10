module Api
  module V1
    module Authenticatable
      extend ActiveSupport::Concern

      included do
        before_action :authenticate_api_user!
      end

      private

      attr_reader :current_authentication

      def current_user
        @current_user
      end

      def authenticate_api_user!
        token = request.headers["Authorization"].to_s
        raise JWT::DecodeError unless token

        payload = Api::V1::JwtToken.decode(token)
        authentication = Authentication.find_by(id: payload.fetch("authentication_id"))
        raise JWT::DecodeError unless authentication

        user = authentication.user
        valid_authentication =
          user &&
          authentication.status &&
          authentication.authentication_expires_at&.future? &&
          authentication.user_id.to_s == payload.fetch("sub").to_s &&
          user.role_id.to_s == payload.fetch("role_id").to_s &&
          user.department_id.to_s == payload.fetch("department_id").to_s &&
          secure_token_match?(authentication.authentication_token, token)

        raise JWT::DecodeError unless valid_authentication

        @current_authentication = authentication
        @current_user = user
      rescue JWT::DecodeError, JWT::ExpiredSignature, KeyError, TypeError, ArgumentError
        render_unauthorized
      end

      def render_unauthorized
        render json: { error: "Invalid or expired authentication token" }, status: :unauthorized
      end

      def secure_token_match?(digest, token)
        expected_digest = Digest::SHA256.hexdigest(token)
        digest.bytesize == expected_digest.bytesize &&
          ActiveSupport::SecurityUtils.secure_compare(digest, expected_digest)
      end
    end
  end
end

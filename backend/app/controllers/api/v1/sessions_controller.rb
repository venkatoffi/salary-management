module Api
  module V1
    class SessionsController < Devise::SessionsController
      skip_before_action :verify_signed_out_user, only: :destroy

      def create
        self.resource = warden.authenticate!(auth_options)
        sign_in(resource_name, resource)

        render json: {
          user: {
            id: resource.id,
            email: resource.email,
            role: resource.role.name
          }
        }, status: :ok
      end

      protected

      def respond_to_on_destroy(non_navigational_status: :no_content)
        head non_navigational_status
      end
    end
  end
end

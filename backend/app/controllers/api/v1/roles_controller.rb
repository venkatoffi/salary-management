class Api::V1::RolesController < Api::V1::BaseController
  before_action :authorize_management!

  def index
    render json: { roles: Role.order(:id).map { |role| { id: role.id, name: role.name } } }
  end
end

class Api::V1::CurrentUserController < Api::V1::BaseController
  def show
    render json: { user: Api::V1::CurrentUserPayload.call(current_user) }
  end
end

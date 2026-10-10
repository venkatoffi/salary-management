class Api::V1::CurrentUserController < Api::V1::BaseController
  def show
    render json: { user: Api::V1::CurrentUserPayload.call(current_user) }
  end

  def update
    if current_user.update(profile_params)
      render json: { user: Api::V1::CurrentUserPayload.call(current_user.reload) }
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def profile_params
    params.require(:user).permit(:first_name, :last_name, :email, :sex, :country_code, :city, :state)
  end
end

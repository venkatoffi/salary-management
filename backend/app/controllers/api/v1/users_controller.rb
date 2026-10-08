module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!
      before_action :authorize_hr!
      before_action :set_user, only: %i[show update destroy]

      def index
        page = positive_param(params[:page], default: 1)
        per_page = positive_param(params[:per_page], default: 25).clamp(1, 100)
        users = User.includes(:role, :department).order(:id)

        render json: {
          users: users.offset((page - 1) * per_page).limit(per_page).map { |user| user_json(user) },
          meta: { page: page, per_page: per_page, total: users.count }
        }
      end

      def show
        render json: { user: user_json(@user) }
      end

      def create
        user = User.new(user_params)

        if user.save
          render json: { user: user_json(user) }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        attributes = user_params
        if attributes[:password].blank?
          attributes.delete(:password)
          attributes.delete(:password_confirmation)
        end

        if @user.update(attributes)
          render json: { user: user_json(@user) }
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        if @user.destroy
          head :no_content
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def authorize_hr!
        return if current_user.role.name.in?([ "Chiefs", "HR Manager" ])

        render json: { error: "You are not authorized to manage users" }, status: :forbidden
      end

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(
          :first_name, :last_name, :email, :sex, :role_id, :job_title, :employee_code,
          :employment_status, :country_code, :city, :date_of_joining, :last_working_date,
          :department_id, :password, :password_confirmation
        )
      end

      def user_json(user)
        {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          sex: user.sex,
          role: { id: user.role_id, name: user.role.name },
          job_title: user.job_title,
          employee_code: user.employee_code,
          employment_status: user.employment_status,
          country_code: user.country_code,
          city: user.city,
          date_of_joining: user.date_of_joining,
          last_working_date: user.last_working_date,
          department: { id: user.department_id, name: user.department.name }
        }
      end

      def positive_param(value, default:)
        parsed = Integer(value, 10)
        parsed.positive? ? parsed : default
      rescue ArgumentError, TypeError
        default
      end
    end
  end
end

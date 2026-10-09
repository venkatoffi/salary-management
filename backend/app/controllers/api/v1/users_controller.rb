class Api::V1::UsersController < Api::V1::BaseController
  before_action :authorize_management!, only: %i[create update destroy]
  before_action :set_user, only: %i[show update destroy]

  def index
    users, meta = paginate(scoped(User.includes(:role, :department), :employees).order(:id))

    render json: {
      users: users.map { |user| user_json(user) },
      meta: meta
    }
  end

  def show
    authorize_record!(@user)
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
end

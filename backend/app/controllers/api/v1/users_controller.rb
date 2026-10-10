class Api::V1::UsersController < Api::V1::BaseController
  before_action :authorize_management!, only: %i[create update destroy]
  before_action :set_user, only: %i[show update destroy]

  def index
    users = scoped(User.includes(:role, department: :department_head), :employees)
    users = filter_users(users)
    users, meta = paginate(users.order(:id))

    render json: {
      users: users.map { |user| user_json(user) },
      meta: meta
    }
  end

  def show
    authorize_record!(@user)
    render json: { user: user_json(@user, include_salary: true) }
  end

  def create
    user = User.new(user_params)

    if user.save
      render json: { user: user_json(user, include_salary: true) }, status: :created
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
      render json: { user: user_json(@user, include_salary: true) }
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

  def filter_users(relation)
    relation = relation.where(department_id: params[:department_id]) if params[:department_id].present?
    relation = relation.where(country_code: params[:country_code]) if params[:country_code].present?
    relation = relation.where(city: params[:city]) if params[:city].present?
    relation = relation.where(employment_status: params[:employment_status]) if params[:employment_status].present?

    if params[:search].present?
      term = "%#{User.sanitize_sql_like(params[:search].strip)}%"
      relation = relation.where(
        "users.first_name ILIKE :term OR users.last_name ILIKE :term OR users.email ILIKE :term OR users.employee_code ILIKE :term",
        term: term
      )
    end

    if params[:min_salary].present? || params[:max_salary].present?
      relation = relation.joins(:salary)
      relation = relation.where("salaries.current_ctc >= ?", params[:min_salary]) if params[:min_salary].present?
      relation = relation.where("salaries.current_ctc <= ?", params[:max_salary]) if params[:max_salary].present?
    end
    relation.distinct
  end

  def user_params
    params.require(:user).permit(
      :first_name, :last_name, :email, :sex, :role_id, :job_title, :employee_code,
      :employment_status, :country_code, :city, :date_of_joining, :last_working_date,
      :state, :department_id, :password, :password_confirmation
    )
  end

  def user_json(user, include_salary: false)
    department = user.department
    manager = department.department_head
    {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      name: user.name,
      email: user.email,
      sex: user.sex,
      role: { id: user.role_id, name: user.role.name },
      job_title: user.job_title,
      employee_code: user.employee_code,
      employment_status: user.employment_status,
      country_code: user.country_code,
      city: user.city,
      state: user.state,
      date_of_joining: user.date_of_joining,
      last_working_date: user.last_working_date,
      department: {
        id: department.id,
        name: department.name,
        description: department.description,
        department_head_id: department.department_head_id
      },
      department_head: manager && { id: manager.id, name: manager.name },
      salary: include_salary && user.salary ? {
        id: user.salary.id,
        current_ctc: user.salary.current_ctc,
        currency_code: user.salary.currency_code,
        effective_from: user.salary.effective_from
      } : nil
    }
  end
end

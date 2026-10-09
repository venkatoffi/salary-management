class Api::V1::SalariesController < Api::V1::BaseController
  before_action :authorize_management!, only: %i[create update]

  def index
    relation = scoped(Salary.includes(:user), :salaries)
    relation = relation.where(user_id: params[:user_id]) if params[:user_id].present?
    salaries, meta = paginate(relation.order(:id))

    render json: { salaries: salaries.map { |salary| salary_json(salary) }, meta: meta }
  end

  def show
    salary = Salary.find(params[:id])
    authorize_record!(salary)

    render json: { salary: salary_json(salary) }
  end

  def create
    salary = Salary.new(salary_create_params)

    if salary.save
      render json: { salary: salary_json(salary) }, status: :created
    else
      render json: { errors: salary.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    salary = Salary.find(params[:id])
    authorize_record!(salary, action: :manage)
    attributes = salary_update_params
    old_ctc = salary.current_ctc

    Salary.transaction do
      salary.update!(attributes)
      salary.user.salary_revisions.create!(
        old_ctc: old_ctc,
        new_ctc: salary.current_ctc,
        revision_date: attributes[:effective_from] || Date.current,
        approved_by: current_user,
        reason: params.dig(:salary, :reason)
      )
    end

    render json: { salary: salary_json(salary.reload) }
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def salary_create_params
    params.require(:salary).permit(:user_id, :currency_code, :current_ctc, :effective_from)
  end

  def salary_update_params
    params.require(:salary).permit(:currency_code, :current_ctc, :effective_from)
  end

  def salary_json(salary)
    {
      id: salary.id,
      user_id: salary.user_id,
      currency_code: salary.currency_code,
      current_ctc: salary.current_ctc,
      effective_from: salary.effective_from
    }
  end
end

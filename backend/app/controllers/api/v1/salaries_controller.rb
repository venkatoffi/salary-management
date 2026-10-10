class Api::V1::SalariesController < Api::V1::BaseController
  before_action :authorize_management!, only: %i[create update]

  def index
    relation = scoped(Salary.includes(user: :department), :salaries)
    relation = relation.where(user_id: params[:user_id]) if params[:user_id].present?
    relation = relation.joins(:user).where(users: { department_id: params[:department_id] }) if params[:department_id].present?
    if params[:search].present?
      term = "%#{User.sanitize_sql_like(params[:search].strip)}%"
      relation = relation.joins(:user).where(
        "users.first_name ILIKE :term OR users.last_name ILIKE :term OR users.employee_code ILIKE :term OR users.email ILIKE :term",
        term: term
      )
    end
    salaries, meta = paginate(relation.order(:id))
    last_revision_dates = SalaryRevision.where(user_id: salaries.map(&:user_id))
                                        .group(:user_id).maximum(:revision_date)

    render json: {
      salaries: salaries.map { |salary| salary_json(salary, last_revision_dates[salary.user_id]) },
      meta: meta
    }
  end

  def show
    salary = Salary.includes(user: :department).find(params[:id])
    authorize_record!(salary)

    revisions = scoped(SalaryRevision.includes(:approved_by), :salary_revisions)
      .where(user_id: salary.user_id).order(revision_date: :desc, id: :desc)
    render json: {
      salary: salary_json(salary, revisions.first&.revision_date),
      salary_revisions: revisions.map { |revision| revision_json(revision) }
    }
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

  def salary_json(salary, last_revision_date = nil)
    {
      id: salary.id,
      user_id: salary.user_id,
      currency_code: salary.currency_code,
      current_ctc: salary.current_ctc,
      effective_from: salary.effective_from,
      last_revision_date: last_revision_date,
      user: {
        id: salary.user.id,
        name: salary.user.name,
        employee_code: salary.user.employee_code,
        date_of_joining: salary.user.date_of_joining,
        department: { id: salary.user.department.id, name: salary.user.department.name }
      }
    }
  end

  def revision_json(revision)
    {
      id: revision.id,
      old_ctc: revision.old_ctc,
      new_ctc: revision.new_ctc,
      revision_date: revision.revision_date,
      approved_by_id: revision.approved_by_id,
      approved_by_name: revision.approved_by.name,
      reason: revision.reason,
      increment_percentage: revision.increment_percentage
    }
  end
end

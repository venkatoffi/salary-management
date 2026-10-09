class Api::V1::SalariesController < Api::V1::BaseController
  def index
    salaries, meta = paginate(scoped(Salary.includes(:user), :salaries).order(:id))

    render json: { salaries: salaries.map { |salary| salary_json(salary) }, meta: meta }
  end

  def show
    salary = Salary.find(params[:id])
    authorize_record!(salary)

    render json: { salary: salary_json(salary) }
  end

  private

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

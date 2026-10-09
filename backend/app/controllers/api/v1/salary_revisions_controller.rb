class Api::V1::SalaryRevisionsController < Api::V1::BaseController
  def index
    salary = Salary.find(params[:salary_id])
    authorize_record!(salary)

    revisions = scoped(SalaryRevision.includes(:salary, :approved_by), :salary_revisions)
    revisions = revisions.where(salary_id: salary.id)
    revisions, meta = paginate(revisions.order(:revision_date, :id))

    render json: {
      salary_revisions: revisions.map { |revision| revision_json(revision) },
      meta: meta
    }
  end

  def show
    revision = SalaryRevision.find(params[:id])
    authorize_record!(revision)
    raise ActiveRecord::RecordNotFound if params[:salary_id] && revision.salary_id.to_s != params[:salary_id]

    render json: { salary_revision: revision_json(revision) }
  end

  private

  def revision_json(revision)
    {
      id: revision.id,
      salary_id: revision.salary_id,
      old_ctc: revision.old_ctc,
      new_ctc: revision.new_ctc,
      revision_date: revision.revision_date,
      approved_by_id: revision.approved_by_id,
      reason: revision.reason,
      increment_percentage: revision.increment_percentage
    }
  end
end

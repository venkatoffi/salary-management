class Api::V1::SalaryRevisionsController < Api::V1::BaseController
  before_action :authorize_management!, only: :create
  before_action :set_user

  def index
    authorize_record!(@user)
    revisions = scoped(SalaryRevision.includes(:user, :approved_by), :salary_revisions)
      .where(user_id: @user.id)
    revisions, meta = paginate(revisions.order(revision_date: :desc, id: :desc))

    render json: {
      salary_revisions: revisions.map { |revision| revision_json(revision) },
      meta: meta
    }
  end

  def create
    revision = @user.salary_revisions.new(revision_params.merge(approved_by: current_user))

    if revision.save
      render json: { salary_revision: revision_json(revision) }, status: :created
    else
      render json: { errors: revision.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = User.find(params[:user_id])
  end

  def revision_params
    params.require(:salary_revision).permit(:old_ctc, :new_ctc, :revision_date, :reason)
  end

  def revision_json(revision)
    {
      id: revision.id,
      user_id: revision.user_id,
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

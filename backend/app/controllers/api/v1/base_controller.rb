class Api::V1::BaseController < ApplicationController
  include Api::V1::Authenticatable

  class Forbidden < StandardError; end

  rescue_from Forbidden, with: :render_forbidden

  private

  def access_policy
    @access_policy ||= Api::V1::AccessPolicy.new(current_user)
  end

  def authorize_record!(record, action: :read)
    raise Forbidden unless access_policy.authorize!(record, action: action)
  end

  def authorize_management!
    raise Forbidden unless access_policy.manage_all?
  end

  def scoped(relation, resource)
    raise Forbidden unless access_policy.can_read_resource?(resource)

    access_policy.scope(relation, resource)
  end

  def paginate(relation)
    page = positive_param(params[:page], default: 1)
    per_page = positive_param(params[:per_page], default: 25).clamp(1, 100)
    records = relation.offset((page - 1) * per_page).limit(per_page)
    meta = { page: page, per_page: per_page, total: relation.count }

    [ records, meta ]
  end

  def positive_param(value, default:)
    parsed = Integer(value, 10)
    parsed.positive? ? parsed : default
  rescue ArgumentError, TypeError
    default
  end

  def render_forbidden
    render json: { error: "You are not authorized to access this resource" }, status: :forbidden
  end
end

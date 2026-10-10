class Api::V1::PayslipsController < Api::V1::BaseController
  def index
    payslips = scoped(Payslip.includes(:user), :payslips)
    payslips = payslips.where(user_id: params[:user_id]) if params[:user_id].present?
    payslips = payslips.where(month: params[:month]) if params[:month].present?
    payslips = payslips.where(year: params[:year]) if params[:year].present?
    payslips, meta = paginate(payslips.order(year: :desc, month: :desc, id: :desc))

    render json: { payslips: payslips.map { |payslip| payslip_json(payslip) }, meta: meta }
  end

  def show
    payslip = Payslip.find(params[:id])
    authorize_record!(payslip)

    render json: { payslip: payslip_json(payslip) }
  end

  private

  def payslip_json(payslip)
    {
      id: payslip.id,
      user_id: payslip.user_id,
      month: payslip.month,
      year: payslip.year,
      total_earnings: payslip.total_earnings,
      total_deduction: payslip.total_deduction,
      net_pay: payslip.net_pay
    }
  end
end

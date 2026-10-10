class ApplicationController < ActionController::API

  def index
    render json: { status: "alive", current_time: Time.current }
  end
end

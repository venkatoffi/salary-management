class Api::V1::DepartmentsController < Api::V1::BaseController
  def index
    departments = scoped(Department.all, :departments).order(:id)

    render json: { departments: departments.map { |department| department_json(department) } }
  end

  def show
    department = Department.find(params[:id])
    authorize_record!(department)

    render json: { department: department_json(department) }
  end

  private

  def department_json(department)
    {
      id: department.id,
      name: department.name,
      description: department.description,
      department_head_id: department.department_head_id
    }
  end
end

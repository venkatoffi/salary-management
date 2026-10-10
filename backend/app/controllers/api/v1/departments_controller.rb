class Api::V1::DepartmentsController < Api::V1::BaseController
  def index
    departments = scoped(Department.includes(:department_head), :departments).order(:id)

    render json: { departments: departments.map { |department| department_json(department) } }
  end

  def show
    department = Department.includes(:department_head).find(params[:id])
    authorize_record!(department)

    render json: { department: department_json(department) }
  end

  private

  def department_json(department)
    {
      id: department.id,
      name: department.name,
      description: department.description,
      department_head_id: department.department_head_id,
      department_head: department.department_head && {
        id: department.department_head.id,
        name: department.department_head.name
      },
      employee_count: department.users.count
    }
  end
end

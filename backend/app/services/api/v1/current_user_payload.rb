class Api::V1::CurrentUserPayload
  def self.call(user)
    permissions = Api::V1::AccessPolicy.new(user).capabilities
    department = user.department

    {
      id: user.id,
      name: user.name,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      sex: user.sex,
      country_code: user.country_code,
      city: user.city,
      state: user.state,
      date_of_joining: user.date_of_joining,
      last_working_date: user.last_working_date,
      employee_code: user.employee_code,
      job_title: user.job_title,
      employment_status: user.employment_status,
      role_name: user.role.name,
      role_id: user.role_id,
      department_id: user.department_id,
      department: { id: department.id, name: department.name, description: department.description },
      department_head: department.department_head && {
        id: department.department_head.id,
        name: department.department_head.name
      },
      salary: user.salary && {
        id: user.salary.id,
        current_ctc: user.salary.current_ctc,
        currency_code: user.salary.currency_code,
        effective_from: user.salary.effective_from
      },
      permission_scope: permissions.fetch(:permission_scope),
      capabilities: permissions.except(:permission_scope)
    }
  end
end

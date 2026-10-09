class Api::V1::AccessPolicy
  PRIVILEGED_ROLES = [ "Chiefs", "HR Manager" ].freeze
  DEPARTMENT_HEAD_ROLE = "Department Heads"
  EMPLOYEE_ROLE = "Employees"
  RESOURCES = %i[employees departments salaries salary_revisions].freeze

  def initialize(user)
    @user = user
  end

  def scope(relation, resource)
    return relation.none unless RESOURCES.include?(resource)
    return relation if privileged?

    case role_name
    when DEPARTMENT_HEAD_ROLE
      department_scope(relation, resource)
    when EMPLOYEE_ROLE
      employee_scope(relation, resource)
    else
      relation.none
    end
  end

  def authorize!(record, action: :read)
    return true if privileged?
    return false unless action == :read

    resource = resource_for(record)
    return false unless resource

    scope(record.class.where(id: record.id), resource).exists?
  end

  def manage_all?
    privileged?
  end

  def can_read_resource?(resource)
    return false unless RESOURCES.include?(resource)
    return true if privileged?
    return true if role_name == DEPARTMENT_HEAD_ROLE

    role_name == EMPLOYEE_ROLE && resource != :departments
  end

  def capabilities
    full_access = privileged?
    department_head = role_name == DEPARTMENT_HEAD_ROLE
    employee = role_name == EMPLOYEE_ROLE

    {
      permission_scope: permission_scope,
      employees: { read: full_access || department_head || employee, manage: full_access },
      departments: { read: full_access || department_head, manage: full_access },
      salaries: { read: full_access || department_head || employee, manage: full_access },
      salary_revisions: { read: full_access || department_head || employee, manage: full_access }
    }
  end

  private

  attr_reader :user

  def role_name
    user.role.name
  end

  def privileged?
    PRIVILEGED_ROLES.include?(role_name)
  end

  def permission_scope
    return "all" if privileged?
    return "department" if role_name == DEPARTMENT_HEAD_ROLE
    return "self" if role_name == EMPLOYEE_ROLE

    "none"
  end

  def department_scope(relation, resource)
    case resource
    when :employees then relation.where(department_id: user.department_id)
    when :departments then relation.where(id: user.department_id)
    when :salaries then relation.joins(:user).where(users: { department_id: user.department_id })
    when :salary_revisions
      relation.joins(salary: :user).where(users: { department_id: user.department_id })
    else relation.none
    end
  end

  def employee_scope(relation, resource)
    case resource
    when :employees then relation.where(id: user.id)
    when :salaries then relation.joins(:user).where(users: { id: user.id })
    when :salary_revisions then relation.joins(salary: :user).where(users: { id: user.id })
    else relation.none
    end
  end

  def resource_for(record)
    case record
    when User then :employees
    when Department then :departments
    when Salary then :salaries
    when SalaryRevision then :salary_revisions
    end
  end
end

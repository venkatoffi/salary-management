require "test_helper"

class Api::V1::RoleAuthorizationTest < ActionDispatch::IntegrationTest
  setup do
    @roles = [ "Chiefs", "HR Manager", "Department Heads", "Employees" ].to_h do |name|
      [ name, Role.create!(name: name) ]
    end
    @engineering = Department.create!(name: "Engineering")
    @finance = Department.create!(name: "Finance")
    @chief = create_user("Chief", "chief@example.test", "CH-001", @roles.fetch("Chiefs"), @engineering)
    @hr_manager = create_user("HR", "hr@example.test", "HR-001", @roles.fetch("HR Manager"), @engineering)
    @department_head = create_user(
      "Head", "head@example.test", "DH-001", @roles.fetch("Department Heads"), @engineering
    )
    @employee = create_user("Employee", "employee@example.test", "EMP-001", @roles.fetch("Employees"), @engineering)
    @other_employee = create_user(
      "Other", "other@example.test", "EMP-002", @roles.fetch("Employees"), @finance
    )
    @engineering.update!(department_head: @department_head)

    @employee_salary = create_salary(@employee, "INR", 100_000)
    @other_salary = create_salary(@other_employee, "USD", 200_000)
    @employee_revision = create_revision(@employee_salary, @chief, 90_000, 100_000)
    @other_revision = create_revision(@other_salary, @hr_manager, 180_000, 200_000)
  end

  test "Chiefs and HR Managers can read all records and manage employees" do
    [ @chief, @hr_manager ].each do |user|
      headers = authenticated_headers(user)

      assert_equal [ @chief, @hr_manager, @department_head, @employee, @other_employee ].map(&:id).sort,
                   get_json("/api/v1/users", headers).fetch("users").map { |record| record.fetch("id") }.sort
      assert_equal [ @engineering, @finance ].map(&:id).sort,
                   get_json("/api/v1/departments", headers).fetch("departments").map { |record| record.fetch("id") }.sort
      assert_equal [ @employee_salary, @other_salary ].map(&:id).sort,
                   get_json("/api/v1/salaries", headers).fetch("salaries").map { |record| record.fetch("id") }.sort
      revisions = [ @employee, @other_employee ].flat_map do |employee|
        get_json("/api/v1/users/#{employee.id}/salary_revisions", headers)
          .fetch("salary_revisions").map { |record| record.fetch("id") }
      end
      assert_equal [ @employee_revision, @other_revision ].map(&:id).sort, revisions.sort

      get "/current_user", headers: headers, as: :json
      assert_response :success
      permissions = response.parsed_body.dig("user", "capabilities")
      assert_equal "all", response.parsed_body.dig("user", "permission_scope")
      assert permissions.values.all? { |capabilities| capabilities.values.all? }
    end

    [ @chief, @hr_manager ].each do |user|
      post "/api/v1/users",
           params: {
             user: {
               first_name: "New", last_name: "User", email: "new-#{user.id}@example.test",
               employee_code: "NEW-#{user.id}", employment_status: "active", country_code: "IN",
               date_of_joining: "2025-01-01", role_id: @roles.fetch("Employees").id,
               department_id: @engineering.id, password: "test-password"
             }
           },
           headers: authenticated_headers(user),
           as: :json
      assert_response :created
    end
  end

  test "Department Heads are restricted to their own department" do
    headers = authenticated_headers(@department_head)

    assert_equal [ @chief, @hr_manager, @department_head, @employee ].map(&:id).sort,
                 get_json("/api/v1/users", headers).fetch("users").map { |record| record.fetch("id") }.sort
    assert_equal [ @engineering.id ],
                 get_json("/api/v1/departments", headers).fetch("departments").map { |record| record.fetch("id") }
    assert_equal [ @employee_salary.id ],
                 get_json("/api/v1/salaries", headers).fetch("salaries").map { |record| record.fetch("id") }
    assert_equal [ @employee_revision.id ],
                 get_json("/api/v1/users/#{@employee.id}/salary_revisions", headers)
                   .fetch("salary_revisions").map { |record| record.fetch("id") }

    get "/api/v1/users/#{@other_employee.id}", headers: headers, as: :json
    assert_response :forbidden
    get "/api/v1/departments/#{@finance.id}", headers: headers, as: :json
    assert_response :forbidden
    get "/api/v1/salaries/#{@other_salary.id}", headers: headers, as: :json
    assert_response :forbidden
    get "/api/v1/users/#{@other_employee.id}/salary_revisions", headers: headers, as: :json
    assert_response :forbidden

    post "/api/v1/users", params: { user: {} }, headers: headers, as: :json
    assert_response :forbidden
  end

  test "Employees can read only their own profile, salary, and revisions" do
    headers = authenticated_headers(@employee)

    assert_equal [ @employee.id ],
                 get_json("/api/v1/users", headers).fetch("users").map { |record| record.fetch("id") }
    get "/api/v1/departments", headers: headers, as: :json
    assert_response :forbidden
    assert_equal [ @employee_salary.id ],
                 get_json("/api/v1/salaries", headers).fetch("salaries").map { |record| record.fetch("id") }
    assert_equal [ @employee_revision.id ],
                 get_json("/api/v1/users/#{@employee.id}/salary_revisions", headers)
                   .fetch("salary_revisions").map { |record| record.fetch("id") }

    get "/api/v1/users/#{@other_employee.id}", headers: headers, as: :json
    assert_response :forbidden
    get "/api/v1/departments/#{@engineering.id}", headers: headers, as: :json
    assert_response :forbidden
    get "/api/v1/salaries/#{@other_salary.id}", headers: headers, as: :json
    assert_response :forbidden
    get "/api/v1/users/#{@other_employee.id}/salary_revisions", headers: headers, as: :json
    assert_response :forbidden

    patch "/api/v1/users/#{@employee.id}",
          params: { user: { first_name: "Changed" } },
          headers: headers,
          as: :json
    assert_response :forbidden
  end

  test "login and current-user responses include role and permission capabilities" do
    post "/login",
         params: { user: { email: @department_head.email, password: "test-password" } },
         as: :json
    assert_response :success
    headers = { "Authorization" => response.parsed_body.fetch("auth_token") }

    login_user = response.parsed_body.fetch("user")
    get "/current_user", headers: headers, as: :json
    assert_response :success

    current_user = response.parsed_body.fetch("user")
    assert_equal login_user, current_user
    assert_equal @department_head.id, current_user.fetch("id")
    assert_equal "Head Test", current_user.fetch("name")
    assert_equal @department_head.email, current_user.fetch("email")
    assert_equal "Department Heads", current_user.fetch("role_name")
    assert_equal @department_head.role_id, current_user.fetch("role_id")
    assert_equal @engineering.id, current_user.fetch("department_id")
    assert_equal "department", current_user.fetch("permission_scope")
    assert_equal(
      { "read" => true, "manage" => false },
      current_user.fetch("capabilities").fetch("employees")
    )
  end

  test "protected endpoints return 401 without a token" do
    [
      "/api/v1/me",
      "/api/v1/users",
      "/api/v1/departments",
      "/api/v1/salaries",
      "/api/v1/users/#{@employee.id}/salary_revisions"
    ].each do |path|
      get path, as: :json
      assert_response :unauthorized
    end
  end

  private

  def create_user(first_name, email, employee_code, role, department)
    User.create!(
      first_name: first_name,
      last_name: "Test",
      email: email,
      employee_code: employee_code,
      employment_status: "active",
      country_code: "IN",
      date_of_joining: Date.new(2020, 1, 1),
      role: role,
      department: department,
      password: "test-password",
      password_confirmation: "test-password"
    )
  end

  def create_salary(user, currency_code, current_ctc)
    Salary.create!(
      user: user,
      currency_code: currency_code,
      current_ctc: current_ctc,
      effective_from: Date.new(2025, 1, 1)
    )
  end

  def create_revision(salary, approver, old_ctc, new_ctc)
    SalaryRevision.create!(
      user: salary.user,
      old_ctc: old_ctc,
      new_ctc: new_ctc,
      revision_date: Date.new(2025, 1, 1),
      approved_by: approver
    )
  end

  def authenticated_headers(user)
    post "/login",
         params: { user: { email: user.email, password: "test-password" } },
         as: :json
    assert_response :success
    { "Authorization" => response.parsed_body.fetch("auth_token") }
  end

  def get_json(path, headers)
    get path, headers: headers, as: :json
    assert_response :success
    response.parsed_body
  end
end

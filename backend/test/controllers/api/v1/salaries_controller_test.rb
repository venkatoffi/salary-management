require "test_helper"

class Api::V1::SalariesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @chief_role = Role.create!(name: "Chiefs")
    @employee_role = Role.create!(name: "Employees")
    @head_role = Role.create!(name: "Department Heads")
    @engineering = Department.create!(name: "Engineering")
    @finance = Department.create!(name: "Finance")
    @chief = create_user("Chief", "chief@example.test", "CH-001", @chief_role, @engineering)
    @employee = create_user("Employee", "employee@example.test", "EMP-001", @employee_role, @engineering)
    @other_employee = create_user("Other", "other@example.test", "EMP-002", @employee_role, @finance)
    @department_head = create_user("Head", "head@example.test", "DH-001", @head_role, @engineering)
    @salary = Salary.create!(
      user: @employee,
      currency_code: "INR",
      current_ctc: 100_000,
      effective_from: Date.new(2025, 1, 1)
    )
  end

  test "salary create and update return JSON and update history transactionally" do
    headers = authenticated_headers(@chief)
    new_salary_attributes = {
      user_id: @other_employee.id,
      currency_code: "USD",
      current_ctc: 200_000,
      effective_from: "2025-03-01"
    }

    post "/api/v1/salaries", params: { salary: new_salary_attributes }, headers: headers, as: :json
    assert_response :created
    created_salary = Salary.find_by!(user: @other_employee)
    assert_equal created_salary.id, response.parsed_body.dig("salary", "id")

    patch "/api/v1/salaries/#{@salary.id}",
          params: {
            salary: {
              user_id: @other_employee.id,
              current_ctc: 120_000,
              effective_from: "2025-04-01",
              reason: "Annual review"
            }
          },
          headers: headers,
          as: :json
    assert_response :success
    assert_equal 120_000, @salary.reload.current_ctc.to_i
    assert_equal @employee.id, @salary.user_id
    revision = @employee.salary_revisions.sole
    assert_equal 100_000, revision.old_ctc.to_i
    assert_equal 120_000, revision.new_ctc.to_i
    assert_equal Date.new(2025, 4, 1), revision.revision_date
    assert_equal @chief.id, revision.approved_by_id
    assert_equal "Annual review", revision.reason

    patch "/api/v1/salaries/#{@salary.id}",
          params: { salary: { current_ctc: 130_000, reason: "x" * 256 } },
          headers: headers,
          as: :json
    assert_response :unprocessable_entity
    assert_equal 120_000, @salary.reload.current_ctc.to_i
    assert_equal 1, @employee.salary_revisions.count
    assert_includes response.parsed_body.fetch("errors"), "Reason is too long (maximum is 255 characters)"

    patch "/api/v1/salaries/#{@salary.id}",
          params: { salary: { current_ctc: -1 } },
          headers: headers,
          as: :json
    assert_response :unprocessable_entity
    assert_equal 120_000, @salary.reload.current_ctc.to_i
    assert_equal 1, @employee.salary_revisions.count
    assert_includes response.parsed_body.fetch("errors"), "Current ctc must be greater than or equal to 0"
  end

  test "salary creation and updates are restricted and salary collections are scoped" do
    department_head_headers = authenticated_headers(@department_head)
    assert_equal [ @salary.id ],
                 get_json("/api/v1/salaries", department_head_headers).fetch("salaries").map { |row| row.fetch("id") }

    filtered_salaries = get_json(
      "/api/v1/salaries?user_id=#{@employee.id}",
      authenticated_headers(@chief)
    ).fetch("salaries")
    assert_equal [ @salary.id ], filtered_salaries.map { |row| row.fetch("id") }

    get "/api/v1/salaries/#{@salary.id}", headers: authenticated_headers(@employee), as: :json
    assert_response :success
    get "/api/v1/salaries/#{Salary.create!(
      user: @other_employee, currency_code: "USD", current_ctc: 200_000, effective_from: Date.current
    ).id}", headers: authenticated_headers(@employee), as: :json
    assert_response :forbidden

    post "/api/v1/salaries",
         params: { salary: { user_id: @employee.id, currency_code: "INR", current_ctc: 1, effective_from: Date.current } },
         headers: department_head_headers,
         as: :json
    assert_response :forbidden
    patch "/api/v1/salaries/#{@salary.id}",
          params: { salary: { current_ctc: 110_000 } },
          headers: department_head_headers,
          as: :json
    assert_response :forbidden
  end

  test "salary revisions are created and read under user routes with role scoping" do
    chief_headers = authenticated_headers(@chief)
    attributes = { old_ctc: 90_000, new_ctc: 100_000, revision_date: "2025-01-01", reason: "Initial" }

    post "/api/v1/users/#{@employee.id}/salary_revisions",
         params: { salary_revision: attributes },
         headers: chief_headers,
         as: :json
    assert_response :created
    revision = @employee.salary_revisions.sole
    assert_equal @chief.id, revision.approved_by_id

    employee_headers = authenticated_headers(@employee)
    assert_equal [ revision.id ],
                 get_json("/api/v1/users/#{@employee.id}/salary_revisions", employee_headers)
                   .fetch("salary_revisions").map { |row| row.fetch("id") }
    get "/api/v1/users/#{@other_employee.id}/salary_revisions", headers: employee_headers, as: :json
    assert_response :forbidden

    post "/api/v1/users/#{@employee.id}/salary_revisions",
         params: { salary_revision: attributes },
         headers: employee_headers,
         as: :json
    assert_response :forbidden
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

  def authenticated_headers(user)
    post "/login", params: { email: user.email, password: "test-password" }, as: :json
    assert_response :success
    { "Authorization" => response.parsed_body.fetch("auth_token") }
  end

  def get_json(path, headers)
    get path, headers: headers, as: :json
    assert_response :success
    response.parsed_body
  end
end

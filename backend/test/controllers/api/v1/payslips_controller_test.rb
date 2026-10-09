require "test_helper"

class Api::V1::PayslipsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @chief_role = Role.create!(name: "Chiefs")
    @head_role = Role.create!(name: "Department Heads")
    @employee_role = Role.create!(name: "Employees")
    @engineering = Department.create!(name: "Engineering")
    @finance = Department.create!(name: "Finance")

    @chief = create_user("Chief", @chief_role, @engineering, "chief@example.test", "CH-001")
    @head = create_user("Head", @head_role, @engineering, "head@example.test", "DH-001")
    @employee = create_user("Employee", @employee_role, @engineering, "employee@example.test", "EMP-001")
    @other_employee = create_user("Other", @employee_role, @finance, "other@example.test", "EMP-002")
    @payslip = create_payslip(@employee, 5)
    @other_payslip = create_payslip(@other_employee, 6)
  end

  test "payslip collections and details are scoped by role" do
    assert_equal [ @other_payslip.id, @payslip.id ],
                 get_json("/api/v1/payslips", authenticated_headers(@chief))
                   .fetch("payslips").map { |payslip| payslip.fetch("id") }

    head_headers = authenticated_headers(@head)
    assert_equal [ @payslip.id ],
                 get_json("/api/v1/payslips", head_headers)
                   .fetch("payslips").map { |payslip| payslip.fetch("id") }
    get "/api/v1/payslips/#{@other_payslip.id}", headers: head_headers, as: :json
    assert_response :forbidden

    employee_headers = authenticated_headers(@employee)
    assert_equal [ @payslip.id ],
                 get_json("/api/v1/payslips", employee_headers)
                   .fetch("payslips").map { |payslip| payslip.fetch("id") }
    get "/api/v1/payslips/#{@other_payslip.id}", headers: employee_headers, as: :json
    assert_response :forbidden
  end

  test "payslip filters and pagination are applied to the authorized collection" do
    create_payslip(@employee, 7)
    response_body = get_json(
      "/api/v1/payslips?user_id=#{@employee.id}&year=2025&page=1&per_page=1",
      authenticated_headers(@chief)
    )

    assert_equal 1, response_body.fetch("payslips").length
    assert_equal @employee.id, response_body.fetch("payslips").first.fetch("user_id")
    assert_equal 2, response_body.dig("meta", "total")
    assert_equal 1, response_body.dig("meta", "page")
  end

  test "payslip endpoints require authentication" do
    get "/api/v1/payslips", as: :json
    assert_response :unauthorized

    get "/api/v1/payslips/#{@payslip.id}", as: :json
    assert_response :unauthorized
  end

  private

  def create_user(first_name, role, department, email, employee_code)
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

  def create_payslip(user, month)
    Payslip.create!(
      user: user,
      month: month,
      year: 2025,
      total_earnings: 10_000,
      total_deduction: 1_000,
      net_pay: 9_000
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

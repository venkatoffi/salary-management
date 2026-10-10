require "test_helper"

class Api::V1::DepartmentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @chief_role = Role.create!(name: "Chiefs")
    @employee_role = Role.create!(name: "Employees")
    @head_role = Role.create!(name: "Department Heads")
    @department = Department.create!(name: "Engineering", description: "Builds and maintains products")
    @other_department = Department.create!(name: "Finance")
    @chief = create_user("Casey", "Chief", "casey@example.test", "CH-001", @chief_role, @department)
    @head = create_user("Harper", "Head", "harper@example.test", "DH-001", @head_role, @department)
    create_user("Avery", "Employee", "avery@example.test", "EMP-001", @employee_role, @department)
    create_user("Riley", "Employee", "riley@example.test", "EMP-002", @employee_role, @other_department)
    @department.update!(department_head: @head)
  end

  test "department listing and detail include head and employee count" do
    headers = authenticated_headers(@chief)
    listing = get_json("/api/v1/departments", headers).fetch("departments")
    engineering = listing.find { |department| department.fetch("id") == @department.id }
    assert_equal "Harper Head", engineering.dig("department_head", "name")
    assert_equal 3, engineering.fetch("employee_count")

    detail = get_json("/api/v1/departments/#{@department.id}", headers).fetch("department")
    assert_equal @department.description, detail.fetch("description")
    assert_equal @head.id, detail.dig("department_head", "id")
    assert_equal 3, detail.fetch("employee_count")
  end

  test "department heads can only see their own department details" do
    headers = authenticated_headers(@head)
    assert_equal [ @department.id ], get_json("/api/v1/departments", headers)
      .fetch("departments").map { |department| department.fetch("id") }

    get "/api/v1/departments/#{@other_department.id}", headers: headers, as: :json
    assert_response :forbidden
  end

  private

  def create_user(first_name, last_name, email, code, role, department)
    User.create!(
      first_name: first_name,
      last_name: last_name,
      email: email,
      employee_code: code,
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
    post "/login", params: { user: { email: user.email, password: "test-password" } }, as: :json
    assert_response :success
    { "Authorization" => response.parsed_body.fetch("auth_token") }
  end

  def get_json(path, headers)
    get path, headers: headers, as: :json
    assert_response :success
    response.parsed_body
  end
end

require "test_helper"

class Api::V1::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @chief_role = Role.create!(name: "Chiefs")
    @employee_role = Role.create!(name: "Employees")
    @department = Department.create!(name: "Engineering")
    @chief = User.create!(
      first_name: "Casey",
      last_name: "Chief",
      email: "casey@example.test",
      employee_code: "CH-001",
      employment_status: "active",
      country_code: "IN",
      date_of_joining: Date.new(2020, 1, 1),
      role: @chief_role,
      department: @department,
      password: "test-password",
      password_confirmation: "test-password"
    )
  end

  test "login returns a JWT and grants access to user CRUD" do
    post "/api/v1/login",
         params: { user: { email: @chief.email, password: "test-password" } },
         as: :json

    assert_response :success
    token = response.headers["Authorization"]
    assert_match(/\ABearer /, token)

    get "/api/v1/users", headers: { "Authorization" => token }, as: :json
    assert_response :success
    assert_equal @chief.email, response.parsed_body.dig("users", 0, "email")

    post "/api/v1/users",
         params: {
           user: {
             first_name: "Taylor",
             last_name: "Employee",
             email: "taylor@example.test",
             employee_code: "EMP-001",
             employment_status: "active",
             country_code: "IN",
             date_of_joining: "2024-01-01",
             role_id: @employee_role.id,
             department_id: @department.id,
             password: "new-password",
             password_confirmation: "new-password"
           }
         },
         headers: { "Authorization" => token },
         as: :json

    assert_response :created
    created_user = User.find_by!(email: "taylor@example.test")
    assert created_user.valid_password?("new-password")
    refute_includes response.body, "encrypted_password"

    patch "/api/v1/users/#{created_user.id}",
          params: { user: { first_name: "Updated" } },
          headers: { "Authorization" => token },
          as: :json
    assert_response :success
    assert_equal "Updated", created_user.reload.first_name

    delete "/api/v1/users/#{created_user.id}",
           headers: { "Authorization" => token },
           as: :json
    assert_response :no_content
    assert_not User.exists?(created_user.id)

    delete "/api/v1/logout", headers: { "Authorization" => token }, as: :json
    assert_response :no_content
    get "/api/v1/users", headers: { "Authorization" => token }, as: :json
    assert_response :unauthorized
  end

  test "user listing is scoped to the authenticated employee" do
    get "/api/v1/users", as: :json

    assert_response :unauthorized

    employee = User.create!(
      first_name: "Emery",
      last_name: "Employee",
      email: "emery@example.test",
      employee_code: "EMP-002",
      employment_status: "active",
      country_code: "IN",
      date_of_joining: Date.new(2024, 1, 1),
      role: @employee_role,
      department: @department,
      password: "test-password",
      password_confirmation: "test-password"
    )
    post "/api/v1/login",
         params: { user: { email: employee.email, password: "test-password" } },
         as: :json
    token = response.headers["Authorization"]

    get "/api/v1/users", headers: { "Authorization" => token }, as: :json

    assert_response :success
    assert_equal [ employee.id ], response.parsed_body.fetch("users").map { |user| user.fetch("id") }

    patch "/api/v1/users/#{employee.id}",
          params: { user: { first_name: "Changed" } },
          headers: { "Authorization" => token },
          as: :json

    assert_response :forbidden
  end
end

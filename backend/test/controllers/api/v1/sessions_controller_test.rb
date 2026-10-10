require "test_helper"

class Api::V1::SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @role = Role.create!(name: "Employees")
    @department = Department.create!(name: "Engineering")
    @user = User.create!(
      first_name: "Alex",
      last_name: "Employee",
      email: "alex@example.test",
      employee_code: "EMP-001",
      employment_status: "active",
      country_code: "IN",
      date_of_joining: Date.new(2020, 1, 1),
      role: @role,
      department: @department,
      password: "test-password",
      password_confirmation: "test-password"
    )
  end

  test "login authenticates with Devise and persists a JWT session digest" do
    post "/login",
         params: { email: @user.email, password: "test-password" },
         as: :json

    assert_response :success
    body = response.parsed_body
    assert body.fetch("auth_token").present?
    assert_operator Time.iso8601(body.fetch("expires_at")), :>, Time.current
    assert_equal(
      {
        "id" => @user.id,
        "name" => "Alex Employee",
        "first_name" => "Alex",
        "last_name" => "Employee",
        "email" => @user.email,
        "sex" => nil,
        "country_code" => "IN",
        "city" => nil,
        "state" => nil,
        "date_of_joining" => "2020-01-01",
        "last_working_date" => nil,
        "employee_code" => "EMP-001",
        "job_title" => nil,
        "employment_status" => "active",
        "role_id" => @role.id,
        "role_name" => "Employees",
        "department_id" => @department.id,
        "department" => { "id" => @department.id, "name" => "Engineering", "description" => nil },
        "department_head" => nil,
        "salary" => nil,
        "permission_scope" => "self",
        "capabilities" => {
          "employees" => { "read" => true, "manage" => false },
          "departments" => { "read" => false, "manage" => false },
          "salaries" => { "read" => true, "manage" => false },
          "salary_revisions" => { "read" => true, "manage" => false },
          "payslips" => { "read" => true, "manage" => false }
        }
      },
      body.fetch("user")
    )

    token = body.fetch("auth_token")
    payload = Api::V1::JwtToken.decode(token)
    assert_equal %w[authentication_id department_id exp iat role_id sub], payload.keys.sort
    assert_equal @user.id.to_s, payload.fetch("sub")
    assert_equal @role.id, payload.fetch("role_id")
    assert_equal @department.id, payload.fetch("department_id")

    authentication = Authentication.find(payload.fetch("authentication_id"))
    assert authentication.status
    assert_equal @user.id, authentication.user_id
    assert_equal Digest::SHA256.hexdigest(token), authentication.authentication_token
    assert_equal Time.at(payload.fetch("exp")).utc.to_i, authentication.authentication_expires_at.to_i
    refute_equal token, authentication.authentication_token
  end

  test "login CORS preflight allows the local frontend to post JSON" do
    options "/login",
            headers: {
              "Origin" => "http://localhost:5173",
              "Access-Control-Request-Method" => "POST",
              "Access-Control-Request-Headers" => "content-type"
            }

    assert_response :success
    assert_equal "http://localhost:5173", response.headers["Access-Control-Allow-Origin"]
    assert_includes response.headers["Access-Control-Allow-Methods"], "POST"
    assert_includes response.headers["Access-Control-Allow-Methods"], "OPTIONS"
    assert_includes response.headers["Access-Control-Allow-Headers"].downcase, "content-type"
    assert_equal 0, @user.authentications.count
  end

  test "invalid credentials return 401 and do not create a session" do
    post "/login",
         params: { user: { email: @user.email, password: "incorrect" } },
         as: :json

    assert_response :unauthorized
    assert_equal 0, @user.authentications.count
  end

  test "missing and malformed authorization headers return 401" do
    get "/current_user", as: :json
    assert_response :unauthorized

    get "/current_user", headers: { "Authorization" => "not-a-jwt" }, as: :json
    assert_response :unauthorized

    delete "/logout", as: :json
    assert_response :unauthorized

    get "/", as: :json
    assert_response :success
  end

  test "current_user restores the authenticated user from the raw JWT" do
    token = login

    get "/current_user",
        headers: { "Authorization" => token },
        as: :json

    assert_response :success
    assert_equal @user.id, response.parsed_body.dig("user", "id")
  end

  test "expired JWTs are rejected" do
    token = login
    authentication = @user.authentications.last
    expired_token = Api::V1::JwtToken.encode(
      user: @user,
      authentication: authentication,
      issued_at: 2.days.ago,
      expires_at: 1.day.ago
    )

    get "/current_user",
        headers: { "Authorization" => expired_token },
        as: :json

    assert_response :unauthorized
  end

  test "expired authentication records are rejected even if the JWT is still valid" do
    token = login
    @user.authentications.last.update_column(:authentication_expires_at, 1.minute.ago)

    get "/current_user",
        headers: { "Authorization" => token },
        as: :json

    assert_response :unauthorized
  end

  test "a JWT with an invalid signature is rejected" do
    token = login
    tampered_token = "#{token}tampered"

    get "/current_user",
        headers: { "Authorization" => tampered_token },
        as: :json

    assert_response :unauthorized
  end

  test "each login creates an independent authentication session" do
    first_token = login
    second_token = login

    assert_equal 2, @user.authentications.count
    assert_not_equal first_token, second_token

    get "/current_user",
        headers: { "Authorization" => first_token },
        as: :json
    assert_response :success
    get "/current_user",
        headers: { "Authorization" => second_token },
        as: :json
    assert_response :success
  end

  test "logout revokes the session and the token immediately fails" do
    token = login
    headers = { "Authorization" => token }

    delete "/logout", headers: headers, as: :json

    assert_response :no_content
    assert_not @user.authentications.last.reload.status

    get "/current_user", headers: headers, as: :json

    assert_response :unauthorized
  end

  private

  def login
    post "/login",
         params: { user: { email: @user.email, password: "test-password" } },
         as: :json
    assert_response :success
    response.parsed_body.fetch("auth_token")
  end
end

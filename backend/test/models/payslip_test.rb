require "test_helper"

class PayslipTest < ActiveSupport::TestCase
  setup do
    role = Role.create!(name: "Employees")
    department = Department.create!(name: "Engineering")
    @user = User.create!(
      first_name: "Alex",
      last_name: "Employee",
      email: "alex@example.test",
      employee_code: "EMP-001",
      employment_status: "active",
      country_code: "IN",
      date_of_joining: Date.new(2020, 1, 1),
      role: role,
      department: department,
      password: "test-password",
      password_confirmation: "test-password"
    )
  end

  test "requires a valid month, year, and non-negative monetary amounts" do
    payslip = build_payslip(month: 13, year: 0, total_earnings: -1, total_deduction: -1, net_pay: -1)

    assert_not payslip.valid?
    assert_includes payslip.errors.attribute_names, :month
    assert_includes payslip.errors.attribute_names, :year
    assert_includes payslip.errors.attribute_names, :total_earnings
    assert_includes payslip.errors.attribute_names, :total_deduction
    assert_includes payslip.errors.attribute_names, :net_pay
  end

  test "allows one payslip per user and month" do
    build_payslip.save!
    duplicate = build_payslip

    assert_not duplicate.valid?
    assert_includes duplicate.errors.attribute_names, :year
  end

  private

  def build_payslip(attributes = {})
    @user.payslips.build(
      { month: 10, year: 2026, total_earnings: 10_000, total_deduction: 1_000, net_pay: 9_000 }.merge(attributes)
    )
  end
end

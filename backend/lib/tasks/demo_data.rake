module DemoDataSeed
  EMPLOYEE_COUNT = 10_000
  INACTIVE_EMPLOYEE_COUNT = 100
  EMPLOYEE_PREFIX = "DEMO-EMP"
  EMPLOYEE_EMAIL_DOMAIN = "demo.salarymanagement.test"
  PAYSLIP_YEAR = 2026
  PAYSLIP_MONTHS = [ 7, 8, 9 ].freeze
  BATCH_SIZE = 1_000
  BASE_SEED = 20_261_010
  DEPARTMENT_DISTRIBUTION = [ 1_667, 1_667, 1_667, 1_667, 1_666, 1_666 ].freeze
  DEPARTMENT_NAMES = [
    "Engineering",
    "Human Resources",
    "Finance",
    "Sales and Marketing",
    "Information Technology",
    "Operations"
  ].freeze
  CTC_RANGES = {
    "Engineering" => [ 700_000, 3_500_000 ],
    "Human Resources" => [ 450_000, 1_800_000 ],
    "Finance" => [ 550_000, 2_500_000 ],
    "Sales and Marketing" => [ 450_000, 3_000_000 ],
    "Information Technology" => [ 600_000, 2_800_000 ],
    "Operations" => [ 400_000, 2_200_000 ]
  }.freeze
  CITIES = %w[
    Bengaluru Mumbai Chennai Hyderabad Pune Kochi Delhi Ahmedabad Jaipur Kolkata
    Coimbatore Indore
  ].freeze
  FIRST_NAMES = %w[
    Aarav Advait Akash Aman Aniket Arjun Dev Dhruv Ishan Kabir Karan Krishna
    Manav Nikhil Pranav Rahul Rohan Sai Siddharth Varun Vihaan Aadhya Ananya
    Diya Isha Kavya Meera Neha Nisha Priya Riya Saanvi Shreya Tara
  ].freeze
  MIDDLE_NAMES = %w[
    Aditya Anand Arvind Ashwin Bharat Chandra Deepak Gopal Hari Jayant Kiran
    Kumar Madhav Mohan Naveen Om Prakash Raj Ramesh Ravi Sanjay Shankar
    Suresh Tejas Uday Vijay Vikram Yash Abhay Amit
  ].freeze
  LAST_NAMES = %w[
    Agarwal Banerjee Bhat Bose Chatterjee Das Desai Gupta Iyer Jain Joshi
    Kapoor Khanna Kulkarni Kumar Malhotra Mehta Menon Mukherjee Nair
    Narayan Patel Pillai Rao Reddy Roy Shah Sharma Singh Sinha Verma
  ].freeze
  JOB_TITLES = {
    "Engineering" => %w[Developer Senior\ Developer Software\ Engineer QA\ Engineer Engineering\ Analyst],
    "Human Resources" => %w[HR\ Generalist Recruiter People\ Operations\ Specialist HR\ Analyst],
    "Finance" => %w[Accountant Financial\ Analyst Payroll\ Specialist Finance\ Associate],
    "Sales and Marketing" => %w[Sales\ Executive Marketing\ Specialist Account\ Manager Sales\ Analyst],
    "Information Technology" => %w[Systems\ Administrator IT\ Support\ Engineer Network\ Analyst Security\ Analyst],
    "Operations" => %w[Operations\ Associate Business\ Analyst Process\ Specialist Operations\ Coordinator]
  }.freeze
  REVISION_REASONS = [ "Demo annual review 2024", "Demo annual review 2025" ].freeze
  REVISION_DATES = [ Date.new(2024, 4, 1), Date.new(2025, 4, 1) ].freeze
  REVISION_USER_COUNT = 1_000

  class Runner
    def run
      ensure_development_environment!
      @password_digest = User.new(password: seed_password).encrypted_password
      @employee_role = Role.find_by!(name: "Employees")
      @departments = DEPARTMENT_NAMES.map { |name| Department.find_by!(name: name) }
      @approver = User.joins(:role).find_by!(roles: { name: "Chiefs" })

      employee_rows = build_employee_rows
      user_counts = upsert_employees(employee_rows)
      employees = load_employees(employee_rows)
      verify_employee_distribution!(employees)

      counts = seed_compensation_data(employees)
      print_summary(user_counts, counts)
      verify_dataset!(employees)
    end

    private

    def ensure_development_environment!
      return if Rails.env.development?

      raise "demo_data:seed is restricted to the development environment"
    end

    def seed_password
      password = ENV.fetch("SEED_USER_PASSWORD") do
        "SalaryDemo2026!"
      end
      raise "SEED_USER_PASSWORD must be at least six characters" if password.length < 6

      password
    end

    def build_employee_rows
      timestamp = Time.current
      department_slots = @departments.zip(DEPARTMENT_DISTRIBUTION).flat_map do |department, count|
        Array.new(count, department)
      end

      rows = Array.new(EMPLOYEE_COUNT) do |index|
        department = department_slots.fetch(index)
        random = Random.new(BASE_SEED + index)
        ctc_min, ctc_max = CTC_RANGES.fetch(department.name)
        annual_ctc = random.rand(ctc_min / 1_000..ctc_max / 1_000) * 1_000
        suffix = format("%05d", index + 1)

        joining_date = Date.new(2017 + index % 9, 1 + index * 7 % 12, 1 + index * 11 % 28)
        inactive = (index % (EMPLOYEE_COUNT / INACTIVE_EMPLOYEE_COUNT)).zero?
        {
          first_name: "#{FIRST_NAMES[index % FIRST_NAMES.length]} #{MIDDLE_NAMES[(index / FIRST_NAMES.length) % MIDDLE_NAMES.length]}",
          last_name: LAST_NAMES[(index / (FIRST_NAMES.length * MIDDLE_NAMES.length)) % LAST_NAMES.length],
          email: "employee.#{suffix}@#{EMPLOYEE_EMAIL_DOMAIN}",
          sex: index.even? ? "Female" : "Male",
          role_id: @employee_role.id,
          job_title: JOB_TITLES.fetch(department.name).fetch(index % JOB_TITLES.fetch(department.name).length),
          employee_code: "#{EMPLOYEE_PREFIX}-#{suffix}",
          employment_status: inactive ? "inactive" : "active",
          country_code: "IN",
          city: CITIES[(index + @departments.index(department) * 2) % CITIES.length],
          date_of_joining: joining_date,
          last_working_date: inactive ? joining_date + 30 + (index % 241) : nil,
          department_id: department.id,
          encrypted_password: @password_digest,
          created_at: timestamp,
          updated_at: timestamp,
          demo_ctc: annual_ctc
        }
      end

      puts "Prepared #{rows.length} deterministic employee records."
      rows
    end

    def upsert_employees(rows)
      emails = rows.map { |row| row.fetch(:email) }
      employee_codes = rows.map { |row| row.fetch(:employee_code) }
      existing_by_email = User.where(email: emails).pluck(:email, :employee_code).to_h
      existing_by_code = User.where(employee_code: employee_codes).pluck(:employee_code, :email).to_h

      rows.each do |row|
        email = row.fetch(:email)
        code = row.fetch(:employee_code)
        if existing_by_email.key?(email) && existing_by_email[email] != code
          raise "Demo employee email is already used by a non-demo account: #{email}"
        end
        if existing_by_code.key?(code) && existing_by_code[code] != email
          raise "Demo employee code is already used by another account: #{code}"
        end
      end

      updated_count = existing_by_code.length
      upsert_in_batches(
        User,
        rows.map { |row| row.except(:demo_ctc) },
        unique_by: :index_users_on_employee_code,
        update_only: %i[
          first_name last_name email sex role_id job_title employment_status country_code
          city date_of_joining last_working_date department_id encrypted_password
        ],
        label: "employees"
      )

      { created: EMPLOYEE_COUNT - updated_count, updated: updated_count }
    end

    def load_employees(rows)
      codes = rows.map { |row| row.fetch(:employee_code) }
      users_by_code = User.where(employee_code: codes).index_by(&:employee_code)

      unless users_by_code.size == EMPLOYEE_COUNT
        raise "Expected #{EMPLOYEE_COUNT} generated users, found #{users_by_code.size}"
      end

      rows.map do |row|
        user = users_by_code.fetch(row.fetch(:employee_code))
        { user: user, department_id: row.fetch(:department_id), base_ctc: row.fetch(:demo_ctc) }
      end
    end

    def verify_employee_distribution!(employees)
      actual = employees.group_by { |entry| entry.fetch(:department_id) }.transform_values(&:size)
      expected = @departments.zip(DEPARTMENT_DISTRIBUTION).to_h { |department, count| [ department.id, count ] }
      raise "Invalid generated department distribution: #{actual.inspect}" unless actual == expected
    end

    def seed_compensation_data(employees)
      user_ids = employees.map { |entry| entry.fetch(:user).id }
      selected = selected_employees(employees)
      selected_ids = selected.map { |entry| entry.fetch(:user).id }
      salaries_before = Salary.where(user_id: user_ids).count
      payslips_before = Payslip.where(user_id: user_ids, year: PAYSLIP_YEAR, month: PAYSLIP_MONTHS).count
      revisions_scope = SalaryRevision.where(user_id: selected_ids, reason: REVISION_REASONS)
      revisions_before = revisions_scope.count

      salary_rows, revision_rows, payslip_rows = build_compensation_rows(employees, selected)
      ActiveRecord::Base.transaction do
        upsert_in_batches(
          Salary,
          salary_rows,
          unique_by: :index_salaries_on_user_id,
          update_only: %i[currency_code current_ctc effective_from],
          label: "salaries"
        )

        revisions_scope.delete_all
        insert_in_batches(SalaryRevision, revision_rows, label: "salary revisions")
        upsert_in_batches(
          Payslip,
          payslip_rows,
          unique_by: :index_payslips_on_user_id_and_month_and_year,
          update_only: %i[total_earnings total_deduction net_pay],
          label: "payslips"
        )
      end

      {
        salaries: { created: EMPLOYEE_COUNT - salaries_before, updated: salaries_before },
        payslips: { created: employees.length * PAYSLIP_MONTHS.length - payslips_before, updated: payslips_before },
        revisions: {
          created: selected.length * 2 - revisions_before,
          updated: revisions_before
        }
      }
    end

    def build_compensation_rows(employees, selected)
      timestamp = Time.current
      revisions_by_user = selected.to_h do |entry|
        user = entry.fetch(:user)
        random = Random.new(BASE_SEED + user.employee_code.last(5).to_i)
        first_hike_basis_points = random.rand(500..1_000)
        second_hike_basis_points = random.rand(500..1_000)
        first_ctc = (BigDecimal(entry.fetch(:base_ctc).to_s) * (1 + BigDecimal(first_hike_basis_points.to_s) / 10_000)).round(2)
        latest_ctc = (first_ctc * (1 + BigDecimal(second_hike_basis_points.to_s) / 10_000)).round(2)
        rows = [
          revision_attributes(user.id, entry.fetch(:base_ctc), first_ctc, REVISION_DATES[0], REVISION_REASONS[0], timestamp),
          revision_attributes(user.id, first_ctc, latest_ctc, REVISION_DATES[1], REVISION_REASONS[1], timestamp)
        ]
        [ user.id, { rows: rows, latest_ctc: latest_ctc } ]
      end

      salary_rows = employees.map do |entry|
        user = entry.fetch(:user)
        latest = revisions_by_user[user.id]&.fetch(:latest_ctc)
        {
          user_id: user.id,
          currency_code: "INR",
          current_ctc: latest || entry.fetch(:base_ctc),
          effective_from: latest ? REVISION_DATES.last : Date.new(2025, 4, 1),
          created_at: timestamp,
          updated_at: timestamp
        }
      end
      revision_rows = revisions_by_user.values.flat_map { |entry| entry.fetch(:rows) }
      salaries_by_user = salary_rows.index_by { |row| row.fetch(:user_id) }

      payslip_rows = employees.flat_map do |entry|
        user_id = entry.fetch(:user).id
        annual_ctc = BigDecimal(salaries_by_user.fetch(user_id).fetch(:current_ctc).to_s)
        earnings = (annual_ctc / 12).round(2)

        PAYSLIP_MONTHS.map do |month|
          random = Random.new(BASE_SEED + user_id * 31 + month)
          deduction_basis_points = random.rand(1_000..2_200)
          deduction = (earnings * deduction_basis_points / 10_000).round(2)
          {
            user_id: user_id,
            month: month,
            year: PAYSLIP_YEAR,
            total_earnings: earnings,
            total_deduction: deduction,
            net_pay: earnings - deduction,
            created_at: timestamp,
            updated_at: timestamp
          }
        end
      end

      [ salary_rows, revision_rows, payslip_rows ]
    end

    def revision_attributes(user_id, old_ctc, new_ctc, revision_date, reason, timestamp)
      {
        user_id: user_id,
        old_ctc: old_ctc,
        new_ctc: new_ctc,
        revision_date: revision_date,
        approved_by_id: @approver.id,
        reason: reason,
        created_at: timestamp,
        updated_at: timestamp
      }
    end

    def upsert_in_batches(model, rows, unique_by:, update_only:, label:)
      rows.each_slice(BATCH_SIZE).with_index(1) do |batch, batch_index|
        model.upsert_all(batch, unique_by: unique_by, update_only: update_only)
        print_progress(label, batch_index, rows.length)
      end
    end

    def insert_in_batches(model, rows, label:)
      rows.each_slice(BATCH_SIZE).with_index(1) do |batch, batch_index|
        model.insert_all!(batch)
        print_progress(label, batch_index, rows.length)
      end
    end

    def print_progress(label, batch_index, total)
      processed = [ batch_index * BATCH_SIZE, total ].min
      puts "Processed #{label}: #{processed}/#{total}"
    end

    def print_summary(users, counts)
      puts "Demo data summary:"
      print_count("Employees", users)
      counts.each { |label, value| print_count(label.to_s.capitalize, value) }
    end

    def print_count(label, counts)
      puts "#{label}: #{counts.fetch(:created)} created, #{counts.fetch(:updated)} updated"
    end

    def verify_dataset!(employees)
      users = User.where(employee_code: employee_codes)
      user_ids = users.pluck(:id)
      raise "Expected exactly #{EMPLOYEE_COUNT} generated employees" unless users.count == EMPLOYEE_COUNT
      unless users.where(employment_status: "active", role_id: @employee_role.id).count == EMPLOYEE_COUNT - INACTIVE_EMPLOYEE_COUNT
        raise "Expected #{EMPLOYEE_COUNT - INACTIVE_EMPLOYEE_COUNT} active generated Employees"
      end
      inactive_users = users.where(employment_status: "inactive", role_id: @employee_role.id)
      unless inactive_users.count == INACTIVE_EMPLOYEE_COUNT &&
             inactive_users.where("last_working_date IS NULL OR last_working_date < date_of_joining").none?
        raise "Expected #{INACTIVE_EMPLOYEE_COUNT} inactive generated employees with valid last working dates"
      end
      unless users.where(employment_status: "active").where.not(last_working_date: nil).none?
        raise "Active generated employees must not have a last working date"
      end

      verify_employee_distribution!(employees)
      salaries = Salary.where(user_id: user_ids)
      raise "Expected exactly #{EMPLOYEE_COUNT} INR salaries" unless salaries.count == EMPLOYEE_COUNT && salaries.where(currency_code: "INR").count == EMPLOYEE_COUNT

      payslips = Payslip.where(user_id: user_ids, year: PAYSLIP_YEAR, month: PAYSLIP_MONTHS)
      expected_payslip_count = EMPLOYEE_COUNT * PAYSLIP_MONTHS.length
      raise "Expected exactly #{expected_payslip_count} July-September payslips" unless payslips.count == expected_payslip_count
      PAYSLIP_MONTHS.each do |month|
        raise "Expected #{EMPLOYEE_COUNT} payslips for month #{month}" unless payslips.where(month: month).count == EMPLOYEE_COUNT
      end
      invalid_net_pay = payslips.where("net_pay <> total_earnings - total_deduction").count
      raise "Found #{invalid_net_pay} payslips with an invalid net-pay calculation" unless invalid_net_pay.zero?
      invalid_earnings = payslips.joins(:user).joins("INNER JOIN salaries ON salaries.user_id = payslips.user_id")
                                 .where("total_earnings <> ROUND(salaries.current_ctc / 12, 2)").count
      raise "Found #{invalid_earnings} payslips with earnings not equal to one-twelfth of annual CTC" unless invalid_earnings.zero?

      selected_ids = selected_employees(employees).map { |entry| entry.fetch(:user).id }
      revisions = SalaryRevision.where(user_id: selected_ids, reason: REVISION_REASONS)
      raise "Expected exactly 2,000 revisions for 1,000 users" unless revisions.count == REVISION_USER_COUNT * 2
      raise "Each selected user must have exactly two revisions" unless revisions.group(:user_id).count.values.all? { |count| count == 2 }
      raise "Revisions must be in April of two consecutive years" unless revisions.distinct.pluck(:revision_date).sort == REVISION_DATES
      user_revision_dates = revisions.to_a.group_by(&:user_id).values
      unless user_revision_dates.length == REVISION_USER_COUNT &&
             user_revision_dates.all? { |records| records.map(&:revision_date).sort == REVISION_DATES }
        raise "Each selected user must have one April revision in each consecutive year"
      end
      unless revisions.all? { |revision| revision.increment_percentage.between?(5, 10) }
        raise "Each salary revision must apply a 5%-10% hike"
      end
      mismatched_current_salaries = SalaryRevision.where(
        user_id: selected_ids,
        reason: REVISION_REASONS.last
      ).joins("INNER JOIN salaries ON salaries.user_id = salary_revisions.user_id")
        .where("salaries.current_ctc <> salary_revisions.new_ctc").count
      unless mismatched_current_salaries.zero?
        raise "Current salary CTC does not match the latest salary revision"
      end

      puts "Verification passed: 10,000 employees (9,900 active, 100 inactive), 10,000 INR salaries, 30,000 payslips, 2,000 revisions for 1,000 users."
      distribution = users.group(:department_id).count
      names_by_id = @departments.index_by(&:id).transform_values(&:name)
      puts "Department distribution: #{distribution.to_h { |id, count| [ names_by_id.fetch(id), count ] }.inspect}"
    end

    def selected_employees(employees)
      stride = EMPLOYEE_COUNT / REVISION_USER_COUNT
      employees.each_with_index.filter_map { |entry, index| entry if (index % stride).zero? }
    end

    def employee_codes
      (1..EMPLOYEE_COUNT).map { |index| "#{EMPLOYEE_PREFIX}-#{format("%05d", index)}" }
    end
  end
end

namespace :demo_data do
  desc "Idempotently seed 10,000 development employees and INR salary history"
  task seed: :environment do
    DemoDataSeed::Runner.new.run
  end
end

# Salary Management API

## Local setup

Install dependencies, prepare the database, and start the Rails API:

```sh
bundle install
bin/rails db:prepare
bin/rails server
```

Set `CEO_USER_PASSWORD` before running `bin/rails db:seed` in development. The
development CEO user is created idempotently by email, and the password is
assigned through Devise without being printed.

The API listens on `http://localhost:3000` by default. The Vite frontend runs
on `http://localhost:5173`; Rails allows that origin by default for CORS.
Set `FRONTEND_ORIGIN` to the exact deployed frontend origin when running
outside local development. Restart the Rails server after changing this value
or editing `config/initializers/cors.rb`.

## INR demo data

`db:seed` creates the standard roles, departments, and leadership users.
Generate the deterministic demo workforce separately from this directory:

```sh
SEED_USER_PASSWORD="SalaryDemo2026!" rbenv exec bundle exec rails demo_data:seed
```

The task is development-only and safe to rerun. It creates or updates 10,000
employee users (9,900 active and 100 inactive with valid last-working dates),
INR salaries, July–September 2026 payslips, and salary revisions for 1,000 of
those users. It uses `SEED_USER_PASSWORD` for the shared
Devise password; if omitted in development only, the existing demo fallback
`SalaryDemo2026!` is used. The password is never printed. The task verifies the
employee and department counts, salary and payslip totals and calculations,
and revision count, dates, and hikes before it exits successfully.

## Tests

```sh
bundle exec rails test
```

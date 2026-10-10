# Salarywise frontend

A responsive HR and salary-management interface built with React, Vite, and
React Router. The app consumes the Rails API; role checks only shape navigation
and UX. Rails remains responsible for authorization.

## Setup

```sh
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_BASE_URL to the Rails server origin, e.g. http://localhost:3000
npm run dev
```

The API base URL can include `/api/v1` (for example
`http://localhost:3000/api/v1`). Login, logout, and current-user requests use
the direct Rails routes `/login`, `/logout`, and `/current_user`; resources use
the versioned API paths. Rails allows `http://localhost:5173` as the local
frontend origin by default. Set the backend's `FRONTEND_ORIGIN` to the exact
origin where the frontend is hosted in other environments, then restart Rails.

## Authentication

After login the opaque `auth_token` is stored in `sessionStorage` for the
current browser session. Every protected API request sends the raw JWT as the
complete `Authorization` header value, with no `Bearer` prefix. The app
restores the user with `GET /current_user`, revokes the session with
`DELETE /logout`, and clears local session state on logout or an API `401`.

## Available screens

- Role-aware overview and navigation
- Employee directory with backend search, filters, and pagination
- Employee and department details
- Current salaries, create/update forms, and revision history
- Read-only payslip listing and details
- Current-user profile

Salary/revision endpoints use `/api/v1/salaries` and
`/api/v1/users/:user_id/salary_revisions`. Payslip reads use
`/api/v1/payslips`. Employee searches are sent to Rails with `search`,
`department_id`, `country_code`, `city`, `employment_status`, and salary range
parameters; only the current server page is loaded.

## Quality checks

```sh
npm test
npm run lint
npm run build
```

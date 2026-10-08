# Architecture — Salary Management System

## 1. Overview

The Salary Management System is a web application for managing employee information and salary data for an organization of approximately 10,000 employees.

The primary persona is the HR Manager. The application also supports Department Head and Employee roles with different levels of access.

The architecture intentionally favors a simple, maintainable design over unnecessary distributed-system complexity.

### Core technology

- Frontend: React.js
- Backend: Ruby on Rails
- Database: PostgreSQL
- API style: RESTful JSON API
- Authentication: Token-based authentication
- Deployment: Containerized application with Docker
- Testing: RSpec for Rails and React testing for frontend behavior
- CI: Automated linting and tests through CI/CD

---

# 2. High-Level Architecture

```text
                         ┌──────────────────────┐
                         │      Web Browser      │
                         │      React.js UI      │
                         └──────────┬───────────┘
                                    │
                              HTTPS / JSON
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Rails API         │
                         │                      │
                         │ Authentication       │
                         │ Authorization        │
                         │ Employees            │
                         │ Departments          │
                         │ Salaries             │
                         │ Salary Revisions     │
                         └──────────┬───────────┘
                                    │
                              ActiveRecord
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     PostgreSQL       │
                         │                      │
                         │ roles                │
                         │ users                │
                         │ departments          │
                         │ salaries             │
                         │ salary_revisions     │
                         │ authentications      │
                         └──────────────────────┘
```

The application follows a clear three-layer architecture:

```text
React UI
   ↓
Rails REST API
   ↓
PostgreSQL
```

---

# 3. Frontend Architecture

The frontend is responsible for presentation, user interaction, client-side state, navigation, and communication with the backend API.

## Main responsibilities

- Login UI
- Role-based navigation
- Employee listing
- Employee search and filtering
- Employee creation and editing
- Employee details
- Department cards and details
- Salary listing
- Salary details
- Salary revision history
- Pagination
- Form validation
- Loading and error states

## Frontend structure

```text
frontend/
└── src/
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.jsx
    │   │   ├── Header.jsx
    │   │   └── DashboardLayout.jsx
    │   │
    │   ├── employees/
    │   │   ├── EmployeeTable.jsx
    │   │   ├── EmployeeFilters.jsx
    │   │   ├── EmployeeCard.jsx
    │   │   └── EmployeeForm.jsx
    │   │
    │   ├── departments/
    │   │   ├── DepartmentCard.jsx
    │   │   └── DepartmentDetails.jsx
    │   │
    │   └── salary/
    │       ├── SalaryTable.jsx
    │       ├── SalaryDetails.jsx
    │       └── SalaryHistory.jsx
    │
    ├── pages/
    │   ├── Login.jsx
    │   ├── Dashboard.jsx
    │   ├── Employees.jsx
    │   ├── EmployeeDetails.jsx
    │   ├── AddEmployee.jsx
    │   ├── Departments.jsx
    │   ├── DepartmentDetails.jsx
    │   ├── Salaries.jsx
    │   └── SalaryDetails.jsx
    │
    ├── services/
    │   └── api.js
    │
    ├── context/
    │   └── AuthContext.jsx
    │
    ├── hooks/
    │   └── useAuth.js
    │
    ├── App.jsx
    └── main.jsx
```

---

# 4. Backend Architecture

The backend uses Ruby on Rails as a REST API application.

The backend is responsible for:

- Authentication
- Authorization
- Business rules
- Data validation
- Employee management
- Department management
- Salary management
- Salary revision management
- Pagination and filtering
- Database access
- API error handling

## Backend structure

```text
backend/
├── app/
│   ├── controllers/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── authentications_controller.rb
│   │   │       ├── users_controller.rb
│   │   │       ├── departments_controller.rb
│   │   │       ├── salaries_controller.rb
│   │   │       └── salary_revisions_controller.rb
│   │   │
│   │   ├── models/
│   │   │   ├── role.rb
│   │   │   ├── user.rb
│   │   │   ├── department.rb
│   │   │   ├── salary.rb
│   │   │   ├── salary_revision.rb
│   │   │   └── authentication.rb
│   │   │
│   │   └── services/
│   │       ├── authentication_service.rb
│   │       └── salary_revision_service.rb
│   │
│   ├── serializers/
│   └── ...
│
├── config/
├── db/
│   ├── migrate/
│   └── seeds.rb
├── spec/
└── ...
```

The exact implementation can be adjusted during development. The main principle is to keep controllers thin and business rules in appropriate models/services.

---

# 5. API Architecture

The frontend communicates with Rails using JSON REST APIs.

The API is versioned:

```text
/api/v1/
```

## Authentication

```text
POST /api/v1/login
POST /api/v1/logout
```

## Users / Employees

```text
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PATCH  /api/v1/users/:id
```

Employee listing supports server-side filtering and pagination.

Example:

```text
GET /api/v1/users?
    search=john&
    department_id=3&
    country_code=IN&
    city=Chennai&
    min_salary=500000&
    max_salary=2000000&
    page=1&
    per_page=10
```

## Departments

```text
GET    /api/v1/departments
GET    /api/v1/departments/:id
POST   /api/v1/departments
PATCH  /api/v1/departments/:id
```

## Salaries

```text
GET   /api/v1/salaries
GET   /api/v1/salaries/:id
PATCH /api/v1/salaries/:id
```

## Salary Revisions

```text
GET  /api/v1/salaries/:salary_id/revisions
POST /api/v1/salaries/:salary_id/revisions
```

---

# 6. Role-Based Access

The application supports three primary login modes.

```text
                         Login
                           │
                           ▼
                     Authenticated User
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         Chief / HR    Department    Employee
          Manager         Head
              │            │            │
              ▼            ▼            ▼
         Full HR       Department    Own Data
          Access          Data         Access
```

## Chief / HR Manager

Can access:

- Dashboard
- Employees
- Departments
- Salary
- Employee creation
- Employee details
- Salary details
- Salary revisions

## Department Head

Can access information relevant to their department.

Typical access:

- Dashboard
- Their department
- Employees belonging to their department
- Relevant salary information

## Employee

Can access their own information.

Typical access:

- Dashboard
- My Profile
- My Salary
- Salary History

Authorization is enforced by the Rails backend. React hides unavailable navigation options for usability, but frontend visibility is not considered a security boundary.

---

# 7. Database Architecture

PostgreSQL is used as the relational database.

Final tables:

```text
roles
users
departments
salaries
salary_revisions
authentications
```

## Relationships

```text
roles
  │
  │ 1:N
  ▼
users
  ├── 1:1 ──► authentications
  ├── 1:1 ──► salaries
  │              │
  │              └── 1:N ──► salary_revisions
  │
  └── N:1 ──► departments
                   │
                   └── department_head_id → users.id
```

`users` represents both employees and application users. There is no separate `employees` table.

---

# 8. Authentication Flow

```text
React Login
    │
    │ email + password
    ▼
POST /api/v1/login
    │
    ▼
Rails Authentication
    │
    ├── Validate credentials
    ├── Check authentication status
    ├── Create/refresh authentication token
    └── Return authenticated user + role
    │
    ▼
React AuthContext
    │
    ▼
Role-based dashboard
```

For authentication tokens, the backend should use secure token handling. A production implementation should avoid storing reusable raw credentials unnecessarily.

Authentication expiry is represented by:

```text
authentication_expires_at
```

The backend should reject expired or revoked authentication.

---

# 9. Employee Search and Filtering

Employee search should be performed server-side.

The UI supports:

- First name
- Last name
- Email
- Department
- Country
- City
- Salary range

The frontend sends filters to Rails, and Rails performs the database query.

```text
React Filters
      │
      ▼
GET /api/v1/users?...filters
      │
      ▼
Rails Controller
      │
      ▼
ActiveRecord Query
      │
      ▼
PostgreSQL
      │
      ▼
Paginated JSON Response
      │
      ▼
React Employee Table
```

This avoids loading all 10,000 employees into the browser.

---

# 10. Pagination

Employee and salary lists use server-side pagination.

Default page size:

```text
10 records per page
```

Example:

```text
GET /api/v1/users?page=1&per_page=10
```

Response can contain:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 10000,
    "total_pages": 1000
  }
}
```

Pagination keeps the browser payload small and provides predictable performance.

---

# 11. Salary Management Flow

When HR creates or updates an employee salary:

```text
HR Manager
    │
    ▼
Salary Details
    │
    ▼
Create Salary Revision
    │
    ├── old_ctc
    ├── new_ctc
    ├── revision_date
    ├── approved_by
    └── reason
    │
    ▼
Update current salary
    │
    ▼
Save revision history
```

The salary revision stores the historical values.

The increment percentage is calculated when needed:

```text
((new_ctc - old_ctc) / old_ctc) × 100
```

It is not stored as a separate database column because it is derived from existing values.

---

# 12. Department Architecture

Departments are stored independently.

```text
departments
    │
    ├── name
    ├── description
    └── department_head_id
              │
              ▼
           users.id
```

Users belong to departments through:

```text
users.department_id
```

This supports:

- Department-level filtering
- Department employee counts
- Department head information
- Department-specific employee views

---

# 13. Performance Considerations

The application is designed for approximately 10,000 employees.

The architecture does not require microservices for this scale.

Important performance decisions:

### Server-side pagination

Only the required records are returned to React.

### Database indexes

Indexes should be added to frequently queried columns such as:

```text
users.email
users.employee_code
users.department_id
users.role_id
departments.name
salaries.user_id
salary_revisions.salary_id
authentications.user_id
authentications.authentication_token
```

### Avoid N+1 queries

Rails queries should use appropriate eager loading when related data is required.

For example, employee lists that display department information should avoid executing one department query per employee.

### Database filtering

Search and filters should be executed by PostgreSQL rather than downloading all employees to React.

### Selective response data

List APIs should return only fields required by the screen rather than unnecessarily returning complete employee and salary objects.

---

# 14. Error Handling

The Rails API should return consistent JSON errors.

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unable to create employee",
    "details": {
      "email": ["has already been taken"]
    }
  }
}
```

Common HTTP statuses:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
422 Unprocessable Entity
500 Internal Server Error
```

React should translate these responses into user-friendly messages.

---

# 15. Validation

Validation should exist at both application and database levels where appropriate.

Examples:

### User

```text
email required
email unique
employee_code required
employee_code unique
date_of_joining required
```

### Salary

```text
current_ctc >= 0
currency_code required
effective_from required
```

### Salary Revision

```text
old_ctc >= 0
new_ctc >= 0
approved_by required
revision_date required
```

Database constraints should provide the final protection against invalid relational data.

---

# 16. Seed Data

The application must be seeded with approximately 10,000 employees.

Seed data should include realistic distributions of:

- Names
- Email addresses
- Employee codes
- Roles
- Departments
- Job titles
- Countries
- Cities
- Employment status
- Salary values
- Salary revisions

The seed process should be deterministic enough for development and testing.

---

# 17. Testing Architecture

Testing should focus on meaningful business behavior rather than maximizing test count.

## Backend

RSpec tests should cover:

- Authentication
- Authorization
- User creation
- User filtering
- Pagination
- Department relationships
- Salary creation/update
- Salary revision history
- Validation rules

Example:

```text
spec/
├── models/
├── requests/
├── services/
└── factories/
```

## Frontend

Frontend tests should cover important user behavior such as:

- Login behavior
- Role-based navigation
- Employee filtering
- Pagination
- Employee form validation
- Salary display
- Salary revision interaction

---

# 18. Deployment Architecture

A simple containerized deployment is sufficient.

```text
                    Internet
                       │
                       ▼
                 ┌───────────┐
                 │   HTTPS   │
                 └─────┬─────┘
                       │
              ┌────────▼────────┐
              │ React Frontend   │
              └────────┬────────┘
                       │ API
                       ▼
              ┌──────────────────┐
              │   Rails API      │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   PostgreSQL     │
              └──────────────────┘
```

Docker can provide consistent development and deployment environments.

---

# 19. CI/CD

The CI pipeline should run on every meaningful pull request/commit.

Suggested pipeline:

```text
Push / Pull Request
        │
        ▼
Install dependencies
        │
        ▼
Lint
        │
        ▼
Backend tests
        │
        ▼
Frontend tests
        │
        ▼
Build application
        │
        ▼
Deploy
```

The exact deployment provider can be decided separately.

---

# 20. Architectural Decisions

## Why Rails?

Ruby on Rails is appropriate for this project because it provides:

- Mature relational database integration
- ActiveRecord
- Strong conventions
- Validation support
- REST API development
- Fast development
- Good testing ecosystem

## Why React?

React provides:

- Component-based UI
- Reusable components
- Clear separation between presentation and backend
- Good support for interactive filtering and pagination

## Why PostgreSQL?

PostgreSQL provides:

- Strong relational integrity
- Excellent indexing
- JSONB support where useful
- Good querying capabilities
- Mature production reliability

## Why a monolith?

The expected scale is approximately 10,000 employees. A Rails modular monolith is simpler and sufficient.

There is no current need for:

```text
Microservices
Kafka
Event-driven architecture
Kubernetes
Multiple databases
Distributed caching
```

These can be introduced later if actual requirements justify them.

---

# 21. Security Considerations

Important security principles:

- HTTPS in production
- Secure authentication token handling
- Authentication expiry
- Backend authorization
- Strong password handling
- Input validation
- Parameterized database queries through ActiveRecord
- Avoid exposing sensitive information in API responses
- CORS configuration
- Rate limiting on authentication endpoints
- Secure environment variables for secrets

Frontend role checks are only for user experience. The Rails backend must enforce authorization.

---

# 22. Architecture Principles

The project follows these principles:

1. Keep the architecture simple.
2. Keep business rules close to the domain.
3. Use the database for relational integrity.
4. Perform filtering and pagination on the server.
5. Avoid N+1 database queries.
6. Keep APIs predictable and versioned.
7. Separate authentication from employee profile data.
8. Preserve salary revision history.
9. Avoid unnecessary technologies.
10. Optimize based on actual requirements rather than hypothetical scale.

---

# 23. Final Architecture

```text
                         SALARY MANAGEMENT SYSTEM

                                ┌──────────┐
                                │  React   │
                                │ Frontend │
                                └────┬─────┘
                                     │
                                  REST API
                                     │
                                     ▼
                           ┌─────────────────┐
                           │   Rails API     │
                           │                 │
                           │ Auth            │
                           │ Authorization   │
                           │ Users           │
                           │ Departments     │
                           │ Salaries        │
                           │ Revisions       │
                           └────────┬────────┘
                                    │
                               ActiveRecord
                                    │
                                    ▼
                           ┌─────────────────┐
                           │   PostgreSQL    │
                           │                 │
                           │ roles           │
                           │ users           │
                           │ departments     │
                           │ salaries        │
                           │ salary_revisions│
                           │ authentications │
                           └─────────────────┘


Roles:
  ├── Chief / HR Manager
  ├── Department Head
  └── Employee

Core UI:
  ├── Login
  ├── Dashboard
  ├── Employees
  ├── Departments
  └── Salary
```

## Final architectural decision

For this assessment, the recommended implementation is a **React + Ruby on Rails REST API + PostgreSQL modular monolith**.

The architecture is intentionally straightforward so that engineering effort can focus on correctness, maintainability, user experience, testing, performance, and thoughtful design rather than unnecessary infrastructure.

# Design Decisions — Salary Management System

## 1. Purpose

This document records the major design decisions made for the Salary Management System.

The purpose is to explain **what was chosen, why it was chosen, and what was deliberately not chosen**.

The system is intended for an organization of approximately 10,000 employees, with the HR Manager as the primary persona.

The guiding principle is:

> Prefer the simplest design that correctly solves the business problem and remains maintainable.

---

# 2. Technology Decisions

## 2.1 React for the Frontend

### Decision

Use **React.js** for the web UI.

### Why

The application requires an interactive UI with:

- Employee search
- Filters
- Pagination
- Employee details
- Department cards
- Salary views
- Role-based navigation
- Forms

React's component model is a good fit for these requirements.

### Alternative considered

A server-rendered Rails UI could have been used.

### Why not

The assessment explicitly supports React/Next.js for the UI, and React provides a clear separation between frontend presentation and the Rails API.

---

# 3. Backend Decision

## 3.1 Ruby on Rails REST API

### Decision

Use **Ruby on Rails** as the backend API.

### Why

Rails is appropriate for the project because it provides:

- Strong relational database support
- ActiveRecord
- Model validations
- REST API support
- Mature testing ecosystem
- Convention over configuration
- Fast development

The project is primarily a relational CRUD and business-management application, which fits Rails well.

### Alternative considered

A separate Node.js or other backend could be used.

### Why not

There is no requirement that justifies introducing another backend technology. Rails is sufficient for the application's scale and domain.

---

# 4. Database Decision

## 4.1 PostgreSQL

### Decision

Use **PostgreSQL** as the relational database.

### Why

The application has strongly related entities:

```text
roles
users
departments
salaries
salary_revisions
authentications
```

PostgreSQL provides:

- Foreign-key constraints
- Unique constraints
- Indexes
- Strong transactional behavior
- Efficient relational queries
- JSONB support where needed

### Alternative considered

MongoDB or another document database.

### Why not

The application's core data is relational, and relationships such as employee → department → salary → salary revision are important to the domain.

A relational database provides stronger integrity for these relationships.

---

# 5. Monolith Decision

## 5.1 Modular Monolith

### Decision

Use a **Rails modular monolith** rather than microservices.

### Why

The application is expected to manage approximately 10,000 employees.

This scale does not require distributed services.

A monolith provides:

- Simpler deployment
- Simpler development
- Easier debugging
- Easier local development
- Straightforward database transactions
- Lower infrastructure complexity

### Alternatives considered

- Microservices
- Event-driven architecture
- Multiple databases
- Kubernetes

### Why not

These technologies would add operational and architectural complexity without a clear requirement from the current problem.

The architecture can evolve later if actual scale or business requirements justify it.

---

# 6. User and Employee Modeling

## 6.1 One `users` Table

### Decision

Use `users` as both the employee/person entity and the application user.

There is **no separate `employees` table**.

### Why

The application is centered around employees who may also interact with the system.

Using one entity avoids unnecessary duplication between:

```text
employees
users
```

The same user can therefore have:

- Employee information
- Application role
- Department
- Salary
- Authentication

### Result

```text
users
 ├── role_id
 ├── department_id
 ├── employee information
 └── application identity
```

---

# 7. Role Modeling

## 7.1 Roles Stored Separately

### Decision

Create a dedicated `roles` table.

```text
roles
  │
  │ 1:N
  ▼
users
```

### Why

Role information should not be hardcoded throughout the frontend or backend.

The database can contain roles such as:

```text
Chief / HR Manager
Department Head
Employee
```

The backend uses the user's role to determine authorization.

### Important security decision

React may hide UI elements that a user cannot access, but **authorization must always be enforced by Rails**.

Frontend checks are for usability, not security.

---

# 8. Department Modeling

## 8.1 Dedicated Departments Table

### Decision

Use a separate `departments` table instead of storing department names directly as text in `users`.

### Why

A dedicated table provides:

- Consistent department names
- Department filtering
- Department employee counts
- Department head relationships
- Department details

Relationship:

```text
departments
      ▲
      │
      │ department_id
      │
    users
```

---

# 9. Department Head Relationship

## 9.1 `department_head_id` References `users.id`

### Decision

The department head is represented as an existing user.

```text
departments.department_head_id
                ↓
             users.id
```

### Why

A department head is already an employee/user.

There is no need for another `department_heads` entity.

This also allows the application to display the department head's:

- Name
- Email
- Job title
- Employee information

### Migration consideration

This creates a circular relationship:

```text
users.department_id → departments.id

departments.department_head_id → users.id
```

Migrations should therefore be created in stages so the foreign keys can be added safely.

---

# 10. Salary Modeling

## 10.1 Separate `salaries` Table

### Decision

Keep salary information separate from the `users` table.

```text
users
  │
  │ 1:1
  ▼
salaries
```

### Why

Employee profile information and salary information represent different concerns.

Separating them provides:

- Cleaner domain boundaries
- Easier salary-specific queries
- Better salary history modeling
- Less clutter in the user table

---

# 11. One Current Salary Per User

### Decision

`salaries.user_id` is unique.

```text
users 1 ───── 1 salaries
```

### Why

The MVP needs one current salary record for each employee.

Historical salary changes are stored separately in `salary_revisions`.

This keeps the current salary lookup simple.

---

# 12. Salary Revision History

## 12.1 Separate `salary_revisions` Table

### Decision

Salary changes are stored as historical records.

```text
salaries
   │
   │ 1:N
   ▼
salary_revisions
```

### Why

The system needs to answer questions such as:

- What is the employee's current CTC?
- What was the previous CTC?
- When did the salary change?
- Who approved the change?
- Why did the salary change?

Keeping revisions separately preserves the history.

---

# 13. Do Not Store Increment Percentage

### Decision

Do not store `increment_percentage` in the database.

### Why

It is a derived value.

It can be calculated from:

```text
old_ctc
new_ctc
```

Formula:

```text
((new_ctc - old_ctc) / old_ctc) × 100
```

### Benefit

This avoids duplicate data and prevents inconsistencies such as:

```text
old_ctc = 10 LPA
new_ctc = 12 LPA
increment_percentage = 15%
```

where the stored percentage could disagree with the actual values.

---

# 14. Authentication Separation

## 14.1 Separate `authentications` Table

### Decision

Authentication information is stored separately from `users`.

```text
users
  │
  │ 1:1
  ▼
authentications
```

### Authentication fields

```text
id
user_id
authentication_token
last_login_at
authentication_expires_at
status
created_at
updated_at
```

### Why

Employee profile data and authentication/session data have different responsibilities.

This keeps authentication concerns isolated from employee information.

---

# 15. Authentication Token and Expiry

### Decision

Authentication uses a token with an explicit expiry time.

```text
authentication_token
authentication_expires_at
status
```

### Why

The system needs to know whether a session/token is:

- Active
- Expired
- Revoked

The backend should reject expired or revoked authentication.

### Security consideration

For a production implementation, reusable authentication tokens should be handled securely and should preferably not be stored as easily reusable raw credentials.

---

# 16. No Payslip Table

### Decision

Do not create a `pay_slips` table in the MVP.

### Why

The current product scope is salary management, not payroll processing.

The application needs to show:

- Current salary
- Salary history
- Salary revisions

It does not need to calculate or generate monthly payslips.

Therefore, the UI should use terminology such as:

```text
Salary Details
Salary History
Salary Revision
```

rather than introducing a payroll/payslip domain.

---

# 17. No Payroll Domain

### Decision

Do not implement payroll processing.

This includes:

```text
Payroll calculation
Monthly payroll runs
Tax calculation
PF calculation
UAN management
Bank payment processing
```

### Why

These are separate business domains and are outside the core salary-management problem.

Adding them would increase complexity without improving the core assessment outcome.

---

# 18. No Separate Employees Table

### Decision

Do not create:

```text
employees
```

### Why

`users` already represents employees.

Creating both tables would create unnecessary duplication and potentially require synchronization between employee and user records.

---

# 19. Server-Side Search

### Decision

Employee search and filtering are performed by the backend.

Supported filters include:

- First name
- Last name
- Email
- Department
- Country
- City
- Salary range

### Why

The application needs to support approximately 10,000 employees.

Loading all records into React and filtering them in the browser would be unnecessary and inefficient.

Instead:

```text
React
  ↓
GET /api/v1/users?filters
  ↓
Rails
  ↓
PostgreSQL
```

---

# 20. Server-Side Pagination

### Decision

Employee and salary lists use server-side pagination.

Default:

```text
10 records per page
```

### Why

Only the records needed by the current page are transferred to the browser.

This provides:

- Smaller API responses
- Faster rendering
- Lower browser memory usage
- Better scalability

---

# 21. Avoid N+1 Queries

### Decision

Related records should be loaded efficiently by Rails.

Example:

When displaying:

```text
Employee
Department
Current Salary
```

the backend should avoid executing a separate database query for every employee's department or salary.

### Why

N+1 queries can create unnecessary database load and poor response times.

Appropriate ActiveRecord eager loading should be used where required.

---

# 22. API Versioning

### Decision

Use a versioned API:

```text
/api/v1/
```

### Why

Versioning gives the API a stable boundary and allows future changes without immediately breaking existing clients.

Example:

```text
/api/v1/users
/api/v1/departments
/api/v1/salaries
```

---

# 23. REST API

### Decision

Use RESTful JSON APIs between React and Rails.

### Why

The application's operations naturally map to resources:

```text
users
departments
salaries
salary_revisions
```

REST keeps the API predictable and easy to understand.

---

# 24. Frontend Role-Based Navigation

### Decision

React renders navigation according to the authenticated user's role.

### Chief / HR Manager

```text
Dashboard
Employees
Departments
Salary
```

### Department Head

```text
Dashboard
My Department
Employees
Salary Overview
```

### Employee

```text
Dashboard
My Profile
My Salary
Salary History
```

### Important

This is a UI decision only.

Actual authorization remains in Rails.

---

# 25. Department UI Decision

### Decision

Departments are represented as cards/widgets rather than only a table.

### Why

The department screen should communicate information quickly:

```text
Department Name
Department Head
Employee Count
Description
```

Example:

```text
┌─────────────────────┐
│ 💻 Engineering      │
│                     │
│ Head: Arun Kumar    │
│ 245 Employees       │
└─────────────────────┘
```

This is a presentation decision and does not affect the underlying relational model.

---

# 26. Employee UI Decision

### Decision

Employees are displayed as a paginated table with filtering.

The primary actions are:

```text
Search
Filter
View
Add Employee
Edit
```

### Why

HR needs to work with a potentially large employee population, so a table is more efficient than displaying thousands of individual cards.

---

# 27. Salary UI Decision

### Decision

Salary is presented as a dedicated management area.

The HR Manager can:

- Search employees
- Filter salaries
- View current CTC
- View salary history
- View salary revision details
- Create salary revisions

### Terminology

Use:

```text
Salary
Current CTC
Salary History
Salary Revision
```

instead of introducing payroll terminology.

---

# 28. Indexing Decisions

Indexes should be created on frequently queried fields.

Important indexes include:

```text
users.email                  UNIQUE
users.employee_code          UNIQUE
users.role_id                INDEX
users.department_id          INDEX

departments.name             UNIQUE

salaries.user_id             UNIQUE

salary_revisions.salary_id   INDEX
salary_revisions.approved_by INDEX

authentications.user_id      UNIQUE
authentications.authentication_token UNIQUE
authentications.status       INDEX
```

### Why

These indexes support:

- Employee lookup
- Employee filtering
- Department filtering
- Salary lookup
- Salary history lookup
- Authentication lookup

Indexes should be added based on actual query patterns rather than indexing every column.

---

# 29. Validation Decisions

Important business rules should be validated in Rails and protected by database constraints where appropriate.

Examples:

```text
email → required + unique
employee_code → required + unique
salary.current_ctc → >= 0
salary.currency_code → required
salary_revision.new_ctc → >= 0
```

### Why

Application validation gives useful user-facing errors.

Database constraints provide a final layer of data integrity.

Both are useful and serve different purposes.

---

# 30. Error Handling Decision

### Decision

Use consistent JSON error responses from the Rails API.

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

### Why

A predictable error format makes frontend error handling simpler and more maintainable.

---

# 31. Seed Data Decision

### Decision

Seed approximately 10,000 employees.

The seed data should include:

- Users
- Roles
- Departments
- Salaries
- Salary revisions

### Why

The assessment explicitly requires a realistic employee dataset.

It also allows the application to demonstrate:

- Pagination
- Search
- Filtering
- Database performance
- Salary reporting

---

# 32. Testing Decision

### Decision

Focus tests on meaningful business behavior.

Backend tests should cover:

- Authentication
- Authorization
- Employee creation
- Employee filtering
- Pagination
- Department relationships
- Salary changes
- Salary revision history
- Validations

Frontend tests should cover important user behavior such as:

- Login
- Role-based navigation
- Employee filters
- Pagination
- Employee form validation
- Salary display

### Principle

The goal is not maximum test count or coverage percentage.

The goal is confidence in important behavior.

---

# 33. Deployment Decision

### Decision

Use a simple containerized deployment.

```text
React
  ↓
Rails API
  ↓
PostgreSQL
```

Docker is used to keep development and deployment environments consistent.

### Why

The application does not require a complex distributed deployment architecture.

---

# 34. CI/CD Decision

### Decision

Use CI to automatically verify changes.

Suggested pipeline:

```text
Commit / Pull Request
        ↓
Install dependencies
        ↓
Lint
        ↓
Backend tests
        ↓
Frontend tests
        ↓
Build
        ↓
Deploy
```

### Why

This provides fast feedback and reduces the chance of introducing broken code.

---

# 35. Deliberately Avoided Complexity

The following were intentionally not introduced:

```text
Microservices
Kafka
Kubernetes
Event sourcing
CQRS
Multiple databases
Complex caching infrastructure
Dedicated search engine
Payroll engine
Tax engine
Payment processing
```

### Reason

The problem does not require these technologies.

Introducing them would make the system harder to understand, test, deploy, and maintain without providing proportional business value.

---

# 36. Summary of Final Decisions

| Area | Decision |
|---|---|
| Frontend | React.js |
| Backend | Ruby on Rails REST API |
| Database | PostgreSQL |
| Architecture | Modular monolith |
| Employee entity | `users` |
| Employee table | Not used |
| Roles | Separate `roles` table |
| Departments | Separate `departments` table |
| Current salary | Separate `salaries` table |
| Salary history | `salary_revisions` |
| Authentication | Separate `authentications` table |
| Audit logs | Not included in final design |
| Search | Server-side |
| Pagination | Server-side |
| Page size | 10 records |
| API | REST + JSON |
| API version | `/api/v1` |
| Authorization | Backend enforced |
| Seed data | ~10,000 employees |
| Deployment | Containerized |
| Testing | Meaningful backend + frontend tests |
| Microservices | Not required |

---

# 37. Final Design Principle

The final design is intentionally simple:

```text
React
  ↓
Rails API
  ↓
PostgreSQL
```

with the core domain:

```text
roles
   ↓
users
   ├── authentications
   ├── salaries
   │      └── salary_revisions
   │
   └── departments
```

The architecture prioritizes **clarity, correctness, maintainability, security, and appropriate scalability** rather than adding complexity for its own sake.

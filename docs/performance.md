# Performance Considerations — Salary Management System

## 1. Purpose

This document describes the performance considerations for the Salary Management System.

The application is designed for approximately **10,000 employees**. The goal is to provide a responsive HR experience while keeping the architecture simple and maintainable.

The main performance principle is:

> Optimize the common paths and database queries first, rather than introducing unnecessary infrastructure.

---

# 2. Expected Scale

The application should support:

- Approximately 10,000 employees
- Employee search and filtering
- Department filtering
- Country and city filtering
- Salary range filtering
- Paginated employee lists
- Salary lists
- Salary revision history
- Multiple concurrent HR/Department Head/Employee users

The expected scale is suitable for a Rails modular monolith with PostgreSQL.

There is no current requirement for microservices or a distributed data architecture.

---

# 3. Performance Architecture

```text
                    React Frontend
                         │
                         │ HTTPS / JSON
                         ▼
                    Rails API
                         │
                 ActiveRecord Queries
                         │
                         ▼
                    PostgreSQL
```

The primary performance focus is therefore:

```text
1. Efficient API requests
2. Efficient database queries
3. Proper indexes
4. Server-side pagination
5. Server-side filtering
6. Avoiding N+1 queries
7. Small API responses
8. Efficient frontend rendering
```

---

# 4. Server-Side Pagination

## Decision

Employee and salary lists use server-side pagination.

The default page size is:

```text
10 records
```

Example:

```text
GET /api/v1/users?page=1&per_page=10
```

Instead of returning all 10,000 employees, the API returns only the records required for the current page.

### Benefits

- Smaller API responses
- Lower database-to-application data transfer
- Lower browser memory usage
- Faster React rendering
- Better perceived performance

---

# 5. Server-Side Filtering

Employee filtering is performed by PostgreSQL through Rails.

Supported filters:

```text
Search
├── First name
├── Last name
└── Email

Department
Country
City
Salary range
```

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

### Why

The frontend should not download all 10,000 records and filter them locally.

The database is better suited to filtering indexed relational data.

---

# 6. Database Indexing

Indexes should support the application's common lookup and filtering operations.

Recommended indexes:

```text
users.email
users.employee_code
users.role_id
users.department_id

departments.name

salaries.user_id

salary_revisions.user_id
salary_revisions.approved_by
salary_revisions.revision_date

authentications.user_id
authentications.authentication_token
authentications.status
authentications.authentication_expires_at
```

Unique fields should use unique indexes where appropriate.

For example:

```text
users.email              UNIQUE
users.employee_code      UNIQUE
salaries.user_id         UNIQUE
authentications.user_id  INDEX
authentications.authentication_token UNIQUE
```

### Principle

Do not automatically index every column.

Indexes should support real query patterns because indexes also consume storage and add work during inserts and updates.

---

# 7. Avoiding N+1 Queries

One of the important Rails performance risks is the N+1 query problem.

For example, an employee list may need:

```text
Employee
Department
Salary
```

A naive implementation could produce:

```text
1 query → employees

then for each employee:
1 query → department
1 query → salary
```

For 10 employees, this can quickly become many queries.

Instead, use appropriate ActiveRecord eager loading when related data is required.

Conceptually:

```ruby
User.includes(:department, :salary)
```

The exact query should be based on the fields required by the API response.

### Goal

Avoid unnecessary database round trips while keeping queries understandable.

---

# 8. Select Only Required Data

List endpoints should avoid returning unnecessary fields.

For example, the employee list may only require:

```text
id
employee_code
first_name
last_name
email
department
city
country
current_ctc
```

There is no need to return every possible employee attribute when the screen does not display it.

This reduces:

- Database data transfer
- JSON response size
- Serialization work
- Browser processing

Detailed employee pages can request additional information separately.

---

# 9. API Response Size

API responses should remain focused on the screen's needs.

### Employee list

Return a compact employee representation.

### Employee details

Return more detailed employee information.

### Salary list

Return salary information required by the salary table.

### Salary details

Return current salary and revision history.

This prevents large nested JSON responses from being returned for every request.

---

# 10. Database Query Design

Queries should be designed around the application's actual access patterns.

Common queries include:

```text
Find employee by email
Find employee by employee code
List employees
Filter employees by department
Filter employees by country
Filter employees by city
Filter employees by salary range
Find current salary
List salary revisions
Find department employees
Authenticate user
```

These queries should be reviewed with the database query planner when performance becomes a concern.

For important queries, PostgreSQL's:

```sql
EXPLAIN
```

or:

```sql
EXPLAIN ANALYZE
```

can be used to understand whether indexes are being used effectively.

---

# 11. Search Performance

The initial search requirement is:

```text
First name
Last name
Email
```

For approximately 10,000 employees, straightforward database filtering should be sufficient.

A typical implementation can use indexed exact or prefix-oriented searches where appropriate.

If future requirements introduce large-scale fuzzy/full-text search, a dedicated search strategy can be evaluated.

### Deliberate decision

Do not introduce Elasticsearch or another search engine for the initial 10,000-employee scope.

---

# 12. Salary Range Filtering

Salary filtering is performed by the database.

Example:

```text
min_salary = 500000
max_salary = 2000000
```

The backend applies the range to the appropriate salary field.

The frontend should not retrieve all salaries and filter them locally.

---

# 13. Department Queries

The department screen may need:

```text
Department name
Department head
Employee count
Description
```

Employee counts should be calculated efficiently.

The API should avoid loading every employee record into memory merely to count employees.

For example, database-level counting can be used where appropriate.

---

# 14. Salary Revision Queries

Salary history should be queried by the salary record.

Example:

```text
GET /api/v1/users/:user_id/salary_revisions
```

The database can use:

```text
salary_revisions.user_id
```

as an index.

Revision history should normally be ordered by:

```text
revision_date DESC
```

so the most recent change appears first.

---

# 15. Authentication Performance

Authentication requests should be lightweight.

Typical flow:

```text
Login
  ↓
Find user
  ↓
Validate credentials
  ↓
Validate/create authentication
  ↓
Return user + role
```

The following fields should be indexed appropriately:

```text
authentications.user_id
authentications.authentication_token
authentications.status
authentications.authentication_expires_at
```

Authentication should not require scanning the entire authentication table.

---

# 16. Frontend Rendering Performance

React should avoid unnecessary rendering.

Important practices:

- Keep components focused
- Keep state close to where it is needed
- Avoid unnecessary global state
- Use stable keys for lists
- Avoid recreating expensive calculations unnecessarily
- Debounce search input when appropriate
- Render only the current page of employees

Because the employee table displays only 10 records at a time, browser-side rendering should remain lightweight.

---

# 17. Search Input Debouncing

The employee search field can use a small debounce.

Without debouncing:

```text
User types:
J
Jo
Joh
John
```

Potentially four API requests could be triggered.

With debouncing:

```text
User types:
John

Wait briefly
   ↓
One API request
```

This reduces unnecessary API traffic.

The debounce duration should remain short enough that the interface still feels responsive.

---

# 18. Loading and Error States

The UI should provide clear states for API operations.

```text
Loading
   ↓
Success
```

or:

```text
Loading
   ↓
Error
```

For tables, skeleton/loading indicators can prevent the interface from appearing frozen.

For forms, the submit button should indicate an in-progress request and prevent accidental duplicate submissions.

---

# 19. Caching

Caching should be introduced only where it provides measurable value.

Initially, the application can rely on:

- PostgreSQL indexes
- Efficient queries
- Server-side pagination
- Small API responses

A distributed cache such as Redis is **not required for the initial implementation**.

If later profiling shows repeated expensive reads, caching can be considered for suitable data such as relatively stable department metadata.

---

# 20. Background Processing

The initial application does not require heavy background processing.

Simple operations such as:

```text
Create employee
Update employee
Create salary revision
Search employees
```

should remain synchronous.

Background jobs can be introduced later for operations such as:

- Large report generation
- Bulk imports
- Notifications
- Scheduled processing

These are not required for the MVP.

---

# 21. Database Connection Management

Rails database connections should be configured appropriately for the deployment environment.

The application should avoid opening unnecessary connections.

Connection pool sizing should be based on:

```text
Application concurrency
Database capacity
Number of application processes/threads
```

The pool should not simply be increased without considering PostgreSQL's available connection capacity.

---

# 22. Transaction Boundaries

Salary changes should use appropriate database transactions.

For example:

```text
Create salary revision
        +
Update current salary
```

These operations represent one business action.

Conceptually:

```text
BEGIN
  Create salary revision
  Update current salary
COMMIT
```

If either operation fails, the transaction should roll back so the system does not end up with inconsistent salary data.

---

# 23. Data Consistency

Performance should not compromise data integrity.

Important constraints include:

```text
users.email UNIQUE
users.employee_code UNIQUE
 salaries.user_id         UNIQUE
authentications.authentication_token UNIQUE
```

Database constraints are preferred for important integrity rules because they remain effective regardless of which application path modifies the data.

---

# 24. Avoid Premature Optimization

The project should not introduce complex performance infrastructure before it is necessary.

Avoid initially adding:

```text
Microservices
Redis
Elasticsearch
Kafka
Kubernetes
Multiple databases
Complex distributed caching
```

The expected scale of 10,000 employees does not justify these components by default.

---

# 25. Performance Testing

Performance should be tested against realistic data.

The seeded dataset should contain approximately:

```text
10,000 employees
```

Useful scenarios to test:

### Employee listing

```text
GET /api/v1/users?page=1&per_page=10
```

### Employee search

```text
GET /api/v1/users?search=john
```

### Department filtering

```text
GET /api/v1/users?department_id=3
```

### Salary filtering

```text
GET /api/v1/users?min_salary=500000&max_salary=2000000
```

### Salary history

```text
GET /api/v1/users/:user_id/salary_revisions
```

The goal is to identify slow queries and unnecessary data transfer rather than optimize arbitrary theoretical workloads.

---

# 26. Query Monitoring

When investigating slow endpoints, measure:

```text
Request duration
Database query duration
Number of SQL queries
Response size
```

A slow endpoint should be investigated from the database outward rather than immediately adding infrastructure.

For example:

```text
Slow employee API
      ↓
Check SQL query count
      ↓
Check for N+1
      ↓
Check query plan
      ↓
Check indexes
      ↓
Check response size
      ↓
Optimize
```

---

# 27. Performance Risks

The main foreseeable performance risks are:

### 1. Loading all employees

**Risk:** Large API response and unnecessary browser work.

**Solution:** Server-side pagination.

### 2. N+1 queries

**Risk:** Many database queries for related records.

**Solution:** Appropriate eager loading.

### 3. Unindexed filters

**Risk:** Increasing database scan cost.

**Solution:** Add indexes based on actual query patterns.

### 4. Large API responses

**Risk:** Higher network and serialization cost.

**Solution:** Return only required fields.

### 5. Excessive search requests

**Risk:** Too many API requests while typing.

**Solution:** Debounce search input.

### 6. Unnecessary infrastructure

**Risk:** Increased operational complexity.

**Solution:** Start with Rails + PostgreSQL and measure before adding components.

---

# 28. Performance Goals

The project should aim for a responsive user experience rather than arbitrary benchmark numbers.

Important goals:

```text
Employee list → Fast initial response
Search/filter → Responsive interaction
Pagination → Small predictable payload
Employee details → Fast retrieval
Salary details → Fast retrieval
Authentication → Lightweight request
```

Exact performance targets should be established after measuring the deployed application under realistic conditions.

---

# 29. Final Performance Strategy

The final performance strategy is:

```text
                    10,000 Employees
                           │
                           ▼
                  Server-side Pagination
                           │
                           ▼
                   Server-side Filtering
                           │
                           ▼
                    Indexed PostgreSQL
                           │
                           ▼
                  Efficient ActiveRecord
                           │
                           ▼
                  Small JSON Responses
                           │
                           ▼
                    Efficient React UI
```

The application should remain a simple Rails + PostgreSQL system while using sound database and API practices.

---

# 30. Final Decision

For the expected scale of approximately 10,000 employees:

```text
React
  ↓
Rails REST API
  ↓
PostgreSQL
```

is sufficient.

The primary optimization techniques are:

1. Server-side pagination
2. Server-side filtering
3. Appropriate database indexes
4. Avoiding N+1 queries
5. Selective API responses
6. Search debouncing
7. Database transactions for related salary changes
8. Realistic seed data and performance testing
9. Query-plan analysis when necessary
10. Measuring before introducing additional infrastructure

The project should optimize for **clarity, predictable performance, and maintainability**, not theoretical scale that the current requirements do not demand.

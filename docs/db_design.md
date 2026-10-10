# Database Design — Salary Management System

## 1. Purpose

This document defines the final relational database structure for the Salary Management System.

The system is designed for an organization of approximately 10,000 employees. The primary user is an HR Manager who needs to manage employee information, salary information, salary revision history, departments, and authentication.

The design intentionally keeps the domain simple and avoids payroll processing, payslips, tax calculation, PF/UAN management, banking/payment processing, and other domains that are outside the assessment scope.

---

# 2. Final Database Structure

```text
                                ┌──────────────┐
                                │    roles     │
                                └──────┬───────┘
                                       │
                                     1 │
                                       │ N
                                ┌──────▼───────┐
                                │     users    │
                                │              │
                                │ Employee +   │
                                │ App User     │
                                └──┬───┬───┘
                                   │   │
                     ┌─────────────┘   │
                     │                 │
                   1:1               1:1
                     │                 │
              ┌──────▼──────┐  ┌──────▼──────┐
              │authentications│ │  salaries   │
              └──────▲───────┘  └───────────────┘
                     │ 1:N
                                      users
                                  ┌─────┴─────┐
                                  │           │
                           ┌──────▼───┐  ┌────▼──────┐
                           │salary_   │  │ payslips  │
                           │revisions │  └───────────┘
                           └──────────┘


        users
          │
          │ N:1
          ▼
    ┌──────────────┐
    │ departments  │
    │              │
    │ department_  │
    │ head_id ─────┼──────────────► users.id
    └──────────────┘
```

## 3. Tables

### 3.1 roles

Stores application roles.

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | PK | Role identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Role name |
| description | TEXT | NULL | Role description |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

Example roles:
- HR Manager
- HR Admin
- Employee

---

### 3.2 users

`users` represents both the employee/person and the application user.

There is intentionally no separate `employees` table.

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | PK | User/employee identifier |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| sex | VARCHAR(20) | NULL | Sex |
| role_id | BIGINT | FK → roles.id | Application role |
| department_id | BIGINT | FK → departments.id | Employee department |
| job_title | VARCHAR(150) | NULL | Job title |
| employee_code | VARCHAR(50) | UNIQUE, NOT NULL | Employee identifier |
| employment_status | VARCHAR(30) | NOT NULL | Employment status |
| country_code | CHAR(2) | NOT NULL | ISO country code |
| city | VARCHAR(100) | NULL | City |
| date_of_joining | DATE | NOT NULL | Joining date |
| last_working_date | DATE | NULL | Last working date |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

### Important design decision

The employee and application user are represented by the same `users` entity.

This avoids unnecessary duplication because the system is centered around people who are employees and may also interact with the application.

---

### 3.3 departments

Stores organizational departments.

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | PK | Department identifier |
| name | VARCHAR(150) | UNIQUE, NOT NULL | Department name |
| description | TEXT | NULL | Department description |
| department_head_id | BIGINT | FK → users.id | User who heads the department |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

### Relationship

```text
departments.department_head_id
              │
              ▼
          users.id
```

A department head is therefore an existing user/employee.

---

### 3.4 salaries

Stores the employee's current salary record.

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | PK | Salary identifier |
| user_id | BIGINT | FK → users.id, UNIQUE | Employee |
| currency_code | CHAR(3) | NOT NULL | ISO currency code |
| current_ctc | DECIMAL(15,2) | NOT NULL | Current annual CTC |
| effective_from | DATE | NOT NULL | Date from which salary is effective |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

### Relationship

```text
users
  │
  │ 1:1
  ▼
salaries
```

`user_id` is unique because the MVP maintains one current salary record per employee.

---

### 3.5 salary_revisions

Stores salary change history.

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | PK | Revision identifier |
| user_id | BIGINT | FK → users.id | User whose salary changed |
| old_ctc | DECIMAL(15,2) | NOT NULL | Previous CTC |
| new_ctc | DECIMAL(15,2) | NOT NULL | New CTC |
| revision_date | DATE | NOT NULL | Date of salary revision |
| approved_by_id | BIGINT | FK → users.id | User who approved the revision |
| reason | VARCHAR(255) | NULL | Reason for revision |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

### Relationship

```text
users
   │
   │ 1:N
   ▼
salary_revisions
```

Salary revisions belong directly to users. Salary remains the user's single
current salary record; updating it and creating its revision happen in one
database transaction.

### Derived value

`increment_percentage` is intentionally NOT stored.

It can be calculated:

```text
increment_percentage =
((new_ctc - old_ctc) / old_ctc) * 100
```

This avoids storing duplicate/derived data.

---

### 3.6 payslips

Stores one payslip per user and month/year. Monetary columns use
`DECIMAL(15,2)`; month is 1–12, year is positive, and all amounts are
non-negative. A unique index on `(user_id, month, year)` prevents duplicates.
No payslip API endpoint is exposed yet.

### 3.7 authentications

Stores authentication/session information separately from employee profile information.

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | PK | Authentication identifier |
| user_id | BIGINT | FK → users.id | User being authenticated |
| authentication_token | VARCHAR(255) | UNIQUE, NOT NULL | Authentication token |
| last_login_at | TIMESTAMP | NULL | Last successful login |
| authentication_expires_at | TIMESTAMP | NULL | Authentication/session expiry |
| status | BOOLEAN | NOT NULL | Whether this session is active |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

Session status:

```text
true  = active
false = revoked
```

### Relationship

```text
users
  │
  │ 1:N
  ▼
authentications
```

The authentication token is stored as a secure digest, and a user may have
multiple independent sessions.

---

# 4. Complete Relationship Summary

| Parent | Child | Relationship | Foreign Key |
|---|---|---|---|
| roles | users | 1:N | users.role_id |
| departments | users | 1:N | users.department_id |
| users | departments | 1:N / reference | departments.department_head_id |
| users | salaries | 1:1 | salaries.user_id |
| users | salary_revisions | 1:N | salary_revisions.user_id |
| users | payslips | 1:N | payslips.user_id |
| users | approved salary revisions | 1:N | salary_revisions.approved_by_id |
| users | authentications | 1:N | authentications.user_id |

---

# 5. Final Entity Relationship View

```text
                         ┌──────────────┐
                         │    roles     │
                         └──────┬───────┘
                                │ 1:N
                                ▼
┌──────────────────────────────────────────────────────────┐
│                         users                             │
│                                                          │
│ Employee + Application User                              │
└───────┬───────────────┬───────────────┘
        │               │
        │ 1:1           │ 1:1
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│authentications│ │   salaries   │
└──────────────┘  └──────────────┘
                          users
                     ┌─────┴─────┐
                     │           │
              ┌──────▼─────┐ ┌───▼───────┐
              │salary_     │ │ payslips  │
              │revisions   │ └───────────┘
              └────────────┘


                         users
                           ▲
                           │ department_head_id
                           │
                    ┌──────┴───────┐
                    │ departments  │
                    └──────────────┘
                           ▲
                           │
                           │ department_id
                           │
                          users
```

---

# 6. Indexes

Recommended indexes for the MVP:

```text
users.email                 UNIQUE INDEX
users.employee_code         UNIQUE INDEX
users.role_id               INDEX
users.department_id         INDEX

departments.name            UNIQUE INDEX
departments.department_head_id INDEX

salaries.user_id            UNIQUE INDEX
salaries.currency_code      INDEX

salary_revisions.user_id    INDEX
salary_revisions.approved_by INDEX
salary_revisions.revision_date INDEX
payslips.user_id, month, year UNIQUE INDEX

authentications.user_id     INDEX
authentications.authentication_token UNIQUE INDEX
authentications.status      INDEX
authentications.authentication_expires_at INDEX
```

These indexes support common operations such as employee lookup, department filtering, salary history lookup, and authentication validation.

---

# 7. Constraints and Data Integrity

The database should enforce important business rules wherever practical.

### Users

- `email` must be unique.
- `employee_code` must be unique.
- `role_id` must reference an existing role.
- `department_id` must reference an existing department.
- `date_of_joining` is required.

### Salaries

- Each user has at most one current salary record.
- `current_ctc` must be greater than or equal to zero.
- `currency_code` is required.
- `effective_from` is required.

### Salary revisions

- `old_ctc` and `new_ctc` are required.
- `new_ctc` should be greater than or equal to zero.
- `approved_by` must reference an existing user.
- `user_id` must reference the user whose revision is recorded.
- Revision history should not be silently deleted.

### Payslips

- Each user has at most one payslip per month/year.
- Month is 1–12; year is positive.
- Earnings, deductions, and net pay are non-negative.

### Authentication

- A user may have multiple authentication sessions.
- Authentication token must be unique.
- Expired/revoked authentication should not be accepted.

---

# 8. Migration Consideration

There is a circular relationship:

```text
users.department_id
        ↓
departments.id

departments.department_head_id
        ↓
users.id
```

Therefore, migrations should be created carefully.

A practical migration sequence is:

1. Create `roles`.
2. Create `users` without the `department_id` foreign key.
3. Create `departments` with `department_head_id`.
4. Add `department_id` to `users`.
5. Add the required foreign-key constraints.
6. Create `salaries`.
7. Create `salary_revisions`.
8. Create `authentications`.

This avoids migration-order problems caused by the circular relationship.

---

# 9. Deliberately Excluded Tables

The following are not part of the MVP database:

```text
employees
payrolls
tax_records
pf_accounts
uan_accounts
bank_accounts
payments
bonuses
benefits
currency_conversions
```

### Reason

These represent separate business domains and are not required to demonstrate the core salary-management problem. Adding them would increase complexity without improving the core assessment outcome.

---

# 10. Final Decision

The current database contains:

```text
1. roles
2. users
3. departments
4. salaries
5. salary_revisions
6. authentications
7. payslips
```

The design favors:

- Simple relational modeling
- Clear ownership and relationships
- Salary history preservation
- Authentication separation
- Proper constraints and indexes
- Maintainability
- Scalability for approximately 10,000 employees
- Avoidance of unnecessary complexity

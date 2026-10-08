# Database Design — Salary Management System

## 1. Purpose

This document defines the final relational database structure for the Salary Management System.

The system is designed for an organization of approximately 10,000 employees. The primary user is an HR Manager who needs to manage employee information, salary information, salary revision history, departments, authentication, and audit history.

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
                                └──┬───┬───┬───┘
                                   │   │   │
                     ┌─────────────┘   │   └─────────────────┐
                     │                 │                     │
                   1:1               1:1                   1:N
                     │                 │                     │
              ┌──────▼──────┐  ┌──────▼──────┐      ┌──────▼──────┐
              │authentications│ │  salaries   │      │ audit_logs  │
              └─────────────┘  └──────┬──────┘      └─────────────┘
                                       │
                                      1:N
                                       │
                              ┌────────▼─────────┐
                              │salary_revisions  │
                              └──────────────────┘


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
| salary_id | BIGINT | FK → salaries.id | Salary record |
| old_ctc | DECIMAL(15,2) | NOT NULL | Previous CTC |
| new_ctc | DECIMAL(15,2) | NOT NULL | New CTC |
| revision_date | DATE | NOT NULL | Date of salary revision |
| approved_by | BIGINT | FK → users.id | User who approved the revision |
| reason | VARCHAR(255) | NULL | Reason for revision |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

### Relationship

```text
salaries
   │
   │ 1:N
   ▼
salary_revisions
```

### Derived value

`increment_percentage` is intentionally NOT stored.

It can be calculated:

```text
increment_percentage =
((new_ctc - old_ctc) / old_ctc) * 100
```

This avoids storing duplicate/derived data.

---

### 3.6 audit_logs

Stores important system activity and salary-related changes.

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | PK | Audit record identifier |
| user_id | BIGINT | FK → users.id | User who performed the action |
| action | VARCHAR(50) | NOT NULL | Action performed |
| auditable_type | VARCHAR(100) | NOT NULL | Entity type being changed |
| auditable_id | BIGINT | NOT NULL | ID of changed entity |
| changes | JSONB | NULL | Before/after change information |
| ip_address | INET | NULL | Request IP address |
| user_agent | TEXT | NULL | Client information |
| created_at | TIMESTAMP | NOT NULL | Time of action |

### Relationship

```text
users
  │
  │ 1:N
  ▼
audit_logs
```

Audit records should be treated as immutable history. Normal application flows should not update or delete audit records.

---

### 3.7 authentications

Stores authentication/session information separately from employee profile information.

| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | PK | Authentication identifier |
| user_id | BIGINT | FK → users.id, UNIQUE | User being authenticated |
| authentication_token | VARCHAR(255) | UNIQUE, NOT NULL | Authentication token |
| last_login_at | TIMESTAMP | NULL | Last successful login |
| authentication_expires_at | TIMESTAMP | NULL | Authentication/session expiry |
| status | VARCHAR(30) | NOT NULL | Authentication status |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

Example statuses:

```text
active
expired
revoked
```

### Relationship

```text
users
  │
  │ 1:1
  ▼
authentications
```

For production security, the authentication token should preferably be stored as a secure hash rather than as a raw token.

---

# 4. Complete Relationship Summary

| Parent | Child | Relationship | Foreign Key |
|---|---|---|---|
| roles | users | 1:N | users.role_id |
| departments | users | 1:N | users.department_id |
| users | departments | 1:N / reference | departments.department_head_id |
| users | salaries | 1:1 | salaries.user_id |
| salaries | salary_revisions | 1:N | salary_revisions.salary_id |
| users | salary_revisions | 1:N | salary_revisions.approved_by |
| users | authentications | 1:1 | authentications.user_id |

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
└───────┬───────────────┬───────────────┬──────────────────┘
        │               │               │
        │ 1:1           │ 1:1           │ 1:N
        ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│authentications│ │   salaries   │  │ audit_logs   │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │ 1:N
                         ▼
                  ┌─────────────────┐
                  │salary_revisions │
                  └─────────────────┘


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

salary_revisions.salary_id  INDEX
salary_revisions.approved_by INDEX
salary_revisions.revision_date INDEX

authentications.user_id     UNIQUE INDEX
authentications.authentication_token UNIQUE INDEX
authentications.status      INDEX
authentications.authentication_expires_at INDEX
```

These indexes support common operations such as employee lookup, department filtering, salary history lookup, audit history, and authentication validation.

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
- Revision history should not be silently deleted.

### Authentication

- One authentication record per user in this design.
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
8. Create `audit_logs`.
9. Create `authentications`.

This avoids migration-order problems caused by the circular relationship.

---

# 9. Deliberately Excluded Tables

The following are not part of the MVP database:

```text
employees
pay_slips
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

The final MVP database contains exactly seven core tables:

```text
1. roles
2. users
3. departments
4. salaries
5. salary_revisions
6. authentications
```

The design favors:

- Simple relational modeling
- Clear ownership and relationships
- Salary history preservation
- Auditability
- Authentication separation
- Proper constraints and indexes
- Maintainability
- Scalability for approximately 10,000 employees
- Avoidance of unnecessary complexity

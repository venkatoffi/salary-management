# Requirements

## 1. Goal

Build a web-based salary management system for an organization with approximately
**10,000 employees**.

The primary user is the **HR Manager**. The system should replace spreadsheet-based
salary management and help HR manage employee salaries and understand how the
organization pays its people.

## 2. Primary User

### HR Manager

The HR Manager should be able to:

- Manage employee information
- Manage current salary information
- Review salary history
- Search and filter employees
- View salary insights
- Review important salary changes

## 3. Core Features

### Employee Management

- Create and update employees
- View employee details
- Search by name, email, or employee code
- Filter by department, country, and employment status
- Paginate employee results

### Salary Management

- View an employee's current salary
- Create and update salary information
- Support multiple currencies
- Set salary effective dates
- Maintain salary revision history
- Record who approved salary revisions

### Salary Insights

Provide useful information such as:

- Total employees
- Average salary
- Minimum and maximum salary
- Salary distribution by department
- Salary distribution by country
- Salary trends based on salary history

### Authentication & Authorization

- Secure user login
- Role-based access control
- Roles such as Admin and HR Manager
- Protect employee and salary data

### Audit Logging

Track important changes including:

- Who performed the action
- What was changed
- Which record was changed
- Previous/new values where applicable
- Timestamp

## 4. Non-Functional Requirements

- Support approximately 10,000 employees
- Use a relational database
- ReactJS or NextJS for the UI
- Backend framework appropriate to the role
- Meaningful, fast, deterministic automated tests
- Appropriate database indexes and constraints
- Avoid unnecessary N+1 queries
- Simple, readable, maintainable code
- Fully functional deployed application
- Seed script for 10,000 employees

## 5. Out of Scope

The following are deliberately excluded from the MVP:

- Payroll processing
- Payslip generation
- Tax calculation
- PF/UAN management
- Bank/payment processing
- Employee self-service
- Complex bonuses, commissions, or benefits
- Currency conversion

These can be added later if product requirements justify them.

## 6. Key Assumptions

- HR Manager is the primary user.
- An employee has one current salary.
- Salary changes preserve historical records.
- Salary contains currency and an effective date.
- Salary changes are attributable to an authenticated user.
- Approximately 10,000 employees is the initial target.
- A relational database is sufficient for this scale.

## 7. Success Criteria

The HR Manager can securely:

1. Manage employees.
2. Manage current salaries.
3. View salary history.
4. Search and filter employees.
5. Understand salary distribution and trends.
6. Audit important salary changes.

## 8. Engineering Principle

> **Simple, understandable, maintainable, and correct.**

Prefer good engineering judgment over unnecessary complexity.
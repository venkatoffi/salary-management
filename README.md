# Salary Management System

A simple web application for managing **employees, departments, and salaries** for an organization of approximately 10,000 employees.

Built as an engineering assessment with a focus on **clarity, maintainability, performance, testing, and practical design decisions**.

## Tech Stack

- **Frontend:** React.js
- **Backend:** Ruby on Rails REST API
- **Database:** PostgreSQL
- **Testing:** RSpec + frontend tests
- **Deployment:** Docker

## Main Features

### HR Manager / Chief

- View and search employees
- Filter employees by department, country, city, and salary range
- Add employees
- View employee details
- Manage departments
- View department heads and employee counts
- View current salaries
- View salary revision history

### Department Head

- View their department
- View employees in their department
- View relevant salary information

### Employee

- View their profile
- View current salary
- View salary history

## Core Database

```text
roles
  │
  ▼
users
  ├── authentications
  ├── salaries
  │      └── salary_revisions
  │
  └── departments
```

The `users` table represents both **employees and application users**.

## Project Structure

```text
salary-management/
│
├── backend/                 # Ruby on Rails API
├── frontend/                # React application
│
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── db_design.md
│   ├── design-decisions.md
│   ├── performance.md
│   └── ai-usage.md
│
├── README.md
└── docker-compose.yml
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd salary-management
```

### 2. Start the application

```bash
docker compose up --build
```

The frontend and backend services will start using Docker.

### 3. Database

The application should create/setup the PostgreSQL database through the Rails setup process.

Typical Rails commands:

```bash
rails db:create
rails db:migrate
rails db:seed
```

The seed process creates approximately **10,000 employees** for testing search, filtering, pagination, and salary functionality.

## API

The backend exposes a versioned REST API:

```text
/api/v1/
```

Main resources:

```text
/api/v1/login
/api/v1/users
/api/v1/departments
/api/v1/salaries
/api/v1/salaries/:id/revisions
```

## Performance

The application uses:

- Server-side pagination
- Server-side filtering
- Database indexes
- Efficient ActiveRecord queries
- N+1 query prevention
- Small API responses
- Search debouncing

The expected scale of 10,000 employees does not require microservices or a distributed architecture.

## Testing

Backend tests:

```bash
bundle exec rspec
```

Frontend tests:

```bash
npm test
```

The tests focus on important business behavior such as authentication, authorization, employee management, filtering, pagination, salary changes, and salary history.

## Documentation

More detailed decisions are documented in:

- [`requirements.md`](docs/requirements.md) — Product scope and requirements
- [`architecture.md`](docs/architecture.md) — Application architecture
- [`db_design.md`](docs/db_design.md) — Database structure and relationships
- [`design-decisions.md`](docs/design-decisions.md) — Important technical decisions
- [`performance.md`](docs/performance.md) — Performance strategy
- [`ai-usage.md`](docs/ai-usage.md) — AI-assisted development approach

## Design Principle

> **Keep it simple, make it correct, and optimize where it matters.**

The project intentionally avoids unnecessary complexity such as microservices, Kafka, Kubernetes, Elasticsearch, payroll processing, tax calculation, and payment processing.

The goal is a clean, understandable, production-minded application that solves the salary-management problem well.

# FinPAC — Finance Data Processing & Access Control Backend

A backend API for a finance dashboard system built with Node.js, Express, and SQLite. It handles user authentication, role-based access control, financial record management, and dashboard-level analytics.

---

## Why these tech choices?

**Node.js + Express** — straightforward choice for a REST API. Fast to set up, easy to structure, and I'm most comfortable with the ecosystem.

**SQLite** — I went with SQLite over PostgreSQL or MongoDB for a deliberate reason: financial data is relational by nature (users reference records, records reference categories), so a document store didn't make sense. SQLite gives me full SQL — joins, aggregations, date filtering — without requiring anyone cloning this to install and configure a database server. The schema is standard SQL and can be migrated to PostgreSQL with minimal changes.

---

## Project Structure

```
src/
├── app.js                        # Entry point
├── config/
│   └── db.js                     # Database connection and query interface
├── models/
│   └── init.js                   # Schema creation, default admin seed
├── middleware/
│   ├── authenticate.js           # JWT verification
│   ├── authorize.js              # Role-based access guard
│   └── validate.js               # Input validation error handler
├── controllers/
│   ├── auth.controller.js        # Register, login, current user
│   ├── user.controller.js        # User management
│   ├── record.controller.js      # Financial records CRUD
│   └── dashboard.controller.js   # Aggregated analytics
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── record.routes.js
│   └── dashboard.routes.js
└── validators/
    ├── auth.validator.js
    ├── user.validator.js
    └── record.validator.js
```

---

## Getting Started

### Requirements
- Node.js v18 or above
- npm

### Setup

```bash
git clone https://github.com/Himanshu-Jorwal/FinPAC.git
cd FinPAC
npm install
cp .env.example .env
npm run dev
```

The server starts at `http://localhost:3000`. On first run, a default admin account is created automatically.

```
Email:    admin@finpac.com
Password: admin123
```

---

## Role System

I defined three roles with a simple hierarchy rather than a full permissions table. It keeps the implementation clean while covering everything needed.

| Role | What they can do |
|---|---|
| **viewer** | Read financial records |
| **analyst** | Read records + create and update records + access dashboard analytics |
| **admin** | Everything above + manage users + delete records |

The `authorize` middleware uses a numeric level per role (viewer=1, analyst=2, admin=3), so checking `authorize('analyst')` automatically passes admins through without needing to list every allowed role explicitly.

---

## API Overview

All protected routes require an `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Create account |
| POST | /api/auth/login | Public | Login and get token |
| GET | /api/auth/me | Any authenticated | Get current user |

### Users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/users | Admin | List all users |
| GET | /api/users/:id | Admin | Get user by ID |
| PATCH | /api/users/:id | Admin | Update role or status |
| DELETE | /api/users/:id | Admin | Delete user |

### Financial Records
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/records | Viewer+ | List records |
| GET | /api/records/:id | Viewer+ | Get single record |
| POST | /api/records | Analyst+ | Create record |
| PATCH | /api/records/:id | Analyst+ | Update record |
| DELETE | /api/records/:id | Admin | Soft delete record |

**Filtering options on GET /api/records:**
- `type` — income or expense
- `category` — partial text match
- `from` and `to` — date range (YYYY-MM-DD)
- `page` and `limit` — pagination (default: page 1, limit 20)

Example:
```
GET /api/records?type=expense&category=food&from=2026-01-01&to=2026-03-31&page=1&limit=10
```

### Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/dashboard/summary | Analyst+ | Total income, expenses, net balance |
| GET | /api/dashboard/categories | Analyst+ | Totals broken down by category |
| GET | /api/dashboard/trends/monthly | Analyst+ | Last 12 months of income vs expenses |
| GET | /api/dashboard/trends/weekly | Analyst+ | Last 8 weeks of income vs expenses |
| GET | /api/dashboard/recent | Analyst+ | 10 most recent transactions |

---

## Sample Requests

**Login**
```json
POST /api/auth/login
{
  "email": "admin@finpac.com",
  "password": "admin123"
}
```

**Create a record**
```json
POST /api/records
{
  "amount": 3500,
  "type": "income",
  "category": "Freelance",
  "date": "2026-04-01",
  "notes": "Website project payment"
}
```

**Dashboard summary response**
```json
{
  "success": true,
  "data": {
    "total_income": 45000,
    "total_expenses": 18200,
    "net_balance": 26800
  }
}
```

---

## Error Responses

All errors follow the same structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount must be a positive number" }
  ]
}
```

| Code | Meaning |
|---|---|
| 400 | Bad request or invalid operation |
| 401 | Missing or invalid token |
| 403 | Valid token but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already registered) |
| 422 | Validation error |
| 500 | Internal server error |

---

## Assumptions and Tradeoffs

**Soft deletes on records** — financial records are never hard deleted. They get an `is_deleted` flag instead. Deleting financial history permanently felt wrong even for an internal tool, so I kept it recoverable at the DB level.

**Analysts can create and update but not delete** — deletion is a more destructive action. I felt it made sense to keep that restricted to admins only, even though the assignment left it open.

**Dashboard is analyst and above** — viewers are assumed to be end users consuming a pre-built UI. Raw aggregation endpoints felt more appropriate for analyst-level access.

**JWT is stateless** — tokens aren't stored server-side, which means there's no logout invalidation. In a production system I'd handle this with a token blacklist or short expiry + refresh token. For this scope it's a reasonable tradeoff.

**SQLite over PostgreSQL** — covered above, but the short version is: portability matters for a submission, and the queries are standard SQL either way.

---

## What I'd add with more time

- Refresh token flow for proper logout support
- Unit and integration tests with Jest and Supertest
- Rate limiting on auth endpoints
- Swagger/OpenAPI docs
- Migration to PostgreSQL for a production deployment

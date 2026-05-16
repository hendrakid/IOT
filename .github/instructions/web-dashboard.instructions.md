---
description: "Use when writing or modifying the web backend (Express.js API), web dashboard frontend, database models, or API routes. Covers Node.js, PostgreSQL, REST API patterns."
applyTo: "web/**"
---
# Web Dashboard & API Conventions

## Tech Stack

- Runtime: Node.js with Express.js
- Language: TypeScript preferred (use type hints everywhere)
- Database: PostgreSQL with parameterized queries (never string concatenation)
- ORM: Prisma or Sequelize (with typed models)
- Testing: Jest or Vitest

## Project Structure

```
web/
├── src/
│   ├── index.ts          # Express app entry point
│   ├── routes/           # Route definitions (one file per resource)
│   ├── controllers/      # Request handlers (business logic)
│   ├── models/           # Database models / Prisma schema
│   ├── middleware/       # Auth, validation, error handling
│   └── utils/            # Shared utilities
├── tests/
│   ├── unit/             # Unit tests (core logic)
│   └── e2e/              # End-to-end tests (API flows)
├── package.json
└── tsconfig.json
```

## REST API Design

- Follow RESTful conventions: proper HTTP verbs, status codes, resource naming
- Use plural nouns for resources: `/api/cards`, `/api/attendance`, `/api/users`
- Return consistent JSON response shape: `{ "success": boolean, "data": ..., "error": ... }`
- Use HTTP status codes correctly: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Internal Error)
- Paginate list endpoints: `?page=1&limit=20`

## Core API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/attendance` | Log attendance from ESP32 |
| GET | `/api/attendance` | List attendance records |
| GET | `/api/cards` | List registered RFID cards |
| POST | `/api/cards` | Register new card |
| DELETE | `/api/cards/:id` | Remove card |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |

## Database

- Use migrations for all schema changes (never manual DDL)
- All queries must use parameterized statements
- Index frequently queried columns (card_uid, timestamp)
- Store card UIDs as uppercase hex strings
- Store timestamps in UTC (ISO 8601)

## Security

- Validate all input at the route/middleware level (use Joi, Zod, or express-validator)
- Authenticate endpoints that modify data (JWT or session-based)
- Sanitize all user inputs to prevent XSS
- Never expose stack traces in production error responses
- Use environment variables for all secrets (`.env` file, never committed)
- Enable CORS only for known origins

## Scripts (package.json)

- `npm run dev` — Start dev server with hot reload (nodemon/tsx)
- `npm run build` — Compile TypeScript
- `npm start` — Run production build
- `npm test` — Run all tests
- `npm run test:unit` — Unit tests only
- `npm run test:e2e` — E2E tests only
- `npm run migrate` — Run database migrations

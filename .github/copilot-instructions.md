# Smart Lock / Absensi RFID — Copilot Instructions

## Project Overview

IoT-based Smart Lock & Attendance system using RFID. An ESP32 reads RFID cards, displays status on OLED, controls a relay (door lock), and sends attendance data via WiFi to a REST API backed by PostgreSQL. A web dashboard provides management and monitoring.

## Memory Bank Structure

The Memory Bank consists of core files and optional context files, all in Markdown format. They are located in ".github/instructions". Files build upon each other in a clear hierarchy:

## Architecture

```
┌─────────────┐       WiFi/HTTP         ┌──────────────────┐       ┌────────────────┐
│   ESP32     │ ───────────────────────►│  REST API        │◄─────►│  PostgreSQL    │
│  + MFRC522  │   POST /api/scan        │  (Express.js)    │       │  Database      │
│  + OLED     │◄─────── JSON ──────────►│                  │       └────────────────┘
│  + Relay    │                         └──────────────────┘
└─────────────┘                                 ▲       
                                                │       
                                    ┌───────────┘       
                                    │                   
                            ┌───────────────┐
                            │ Web Dashboard │
                            │ (Frontend)    │
                            └───────────────┘
```

## Tech Stack

| Component       | Technology                                      |
|-----------------|-------------------------------------------------|
| Microcontroller | ESP32 DevKit V1 (Arduino framework/PlatformIO)  |
| RFID Module     | MFRC522 (SPI interface)                         |
| Display         | OLED 0.96" 128x64 SSD1306 (I2C interface)       |
| Actuator        | 5V Relay Module                                 |
| Backend API     | Node.js + Express.js (TypeScript)               |
| Database        | PostgreSQL                                      |
| Web Dashboard   | HTML/CSS/JS (Alpine.js + Tailwind CSS)          |
| Build System    | PlatformIO (firmware), npm (web)                |

## Folder Structure

```
/
├── firmware/               # ESP32 PlatformIO project
│   ├── src/main.cpp
│   ├── include/            # config.h, rfid.h, display.h
│   └── platformio.ini
├── web/                    # Express.js backend + web dashboard
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   │   └── migrations/ # SQL migration files (numbered)
│   │   ├── routes/
│   │   └── utils/
│   ├── public/             # Static frontend (dashboard.html, js/)
│   └── tests/
│       ├── unit/
│       └── e2e/
└── .github/                # Copilot instructions, CI/CD, prompts
```

---

## General Coding Conventions

- **TypeScript** for all web code — use strict types everywhere, avoid `any`
- **C++/Arduino** for firmware — use `#pragma once`, `const`, typed pin constants
- Use **semicolons** in all TypeScript/JavaScript files
- Function names: `camelCase`; constants: `UPPER_SNAKE_CASE`; classes: `PascalCase`
- Keep functions **small and single-purpose** — one responsibility per function
- English for all identifiers, comments, and documentation

---

## Web / API Conventions

### REST Design

- Follow RESTful conventions: proper HTTP verbs, status codes, resource naming
- Use **plural nouns** for resources: `/api/cards`, `/api/users`, `/api/attendance`
- Consistent JSON response shape:
  ```json
  { "success": true, "data": { ... } }
  { "success": false, "error": "Reason" }
  ```
- HTTP status codes: `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `404` Not Found, `409` Conflict, `500` Internal Error
- Paginate list endpoints: `?page=1&limit=20`; respond with `meta: { page, limit, total }`

### Database

- All queries use **parameterized statements** — never string concatenation
- Schema changes via numbered SQL migrations in `web/src/models/migrations/`
- Store card UIDs as **UPPERCASE** hex strings (e.g. `"ABCD1234"`)
- Store timestamps in UTC (`TIMESTAMPTZ`)
- Add indexes on frequently queried columns: `card_uid`, `timestamp`, `user_id`

### Security

- Validate all inputs using **Zod** schemas at the route/middleware level
- Authenticate all data-modification endpoints with **JWT** (`requireAuth` middleware)
- ESP32 scan endpoint (`POST /api/scan`) is **unauthenticated** by design — rate-limited instead
- Never expose stack traces in production (`NODE_ENV=production` suppresses them)
- All secrets in **`.env`** — never commit to version control

### TypeScript Patterns

```typescript
// Always type request bodies
const { card_uid, user_id } = req.body as { card_uid: string; user_id: number };

// Use next(err) for async error propagation
export async function handler(req, res, next): Promise<void> {
  try { ... } catch (err) { next(err); }
}

// Narrow unknown errors before accessing properties
if ((err as { code?: string }).code === "23505") { /* unique violation */ }
```

---

## Firmware Conventions (ESP32 + Arduino)

### Structure

- Entry point: `src/main.cpp` with `setup()` and `loop()`
- Separate concerns into header modules: `rfid.h`, `display.h`, `config.h`
- **Never use `delay()` for production timing** — use `millis()`-based non-blocking patterns

### RFID (MFRC522 via SPI)

- Library: `miguelbalboa/MFRC522`
- Always call `PICC_HaltA()` + `PCD_StopCrypto1()` after each read
- Convert UID bytes to uppercase hex string for API

### OLED (SSD1306 via I2C)

- Library: `adafruit/Adafruit SSD1306`
- Always `clearDisplay()` before writing; always call `display()` to flush

### WiFi & HTTP

- Check `WiFi.status()` before each request; reconnect if disconnected
- Use `ArduinoJson` for all JSON serialization/deserialization
- Set `http.setTimeout(HTTP_TIMEOUT_MS)` to prevent indefinite blocking
- **Fail-safe on error**: deny access if server unreachable, not grant

### Relay

- Define relay as active LOW or HIGH — document clearly in code
- Set relay to **locked/safe state** in `setup()` and on any error
- Use `millis()` timer for auto-lock timeout, not `delay()`

---

## Android Conventions


---

## API Endpoints Reference

| Method | Path                             | Auth | Description                           |
|--------|----------------------------------|------|---------------------------------------|
| POST   | `/api/auth/login`                | No   | Admin login → JWT token               |
| POST   | `/api/scan`                      | No   | ESP32 card tap → attendance + SSE     |
| GET    | `/api/scan/stream`               | JWT* | SSE stream for dashboard              |
| GET    | `/api/cards`                     | JWT  | List cards (paginated)                |
| POST   | `/api/cards`                     | JWT  | Register new card                     |
| DELETE | `/api/cards/:id`                 | JWT  | Delete card                           |
| GET    | `/api/users`                     | JWT  | List users                            |
| POST   | `/api/users`                     | JWT  | Create user (with access points)      |
| PUT    | `/api/users/:id`                 | JWT  | Update user                           |
| GET    | `/api/users/:id/access-points`   | JWT  | List access points for user           |
| POST   | `/api/users/:id/access-points`   | JWT  | Grant access point to user            |
| DELETE | `/api/users/:id/access-points`   | JWT  | Revoke access point from user         |
| GET    | `/api/attendance`                | JWT  | List attendance logs (paginated)      |
| GET    | `/api/access-points`             | No   | List all access points                |
| GET    | `/api/access-points/card/:id`    | No   | Get access points for a card          |

\* SSE uses `?token=` query param because `EventSource` cannot set headers.

---

## Database Schema Summary

```
admins           → id, username, password (bcrypt), created_at
users            → id, name, email, role, created_at
cards            → id, card_uid (UNIQUE), label, user_id → users, created_at
access_points    → id, name, type, location, created_at
user_access_points → id, user_id → users, access_point_id → access_points (UNIQUE pair)
attendance       → id, card_uid, user_id → users (nullable), action, timestamp
```

Migrations are numbered `001_` ... `010_` and applied in order by `src/models/migrate.ts`.

---

## Testing Standards

### Backend (Jest + Supertest)

- **Unit tests**: `tests/unit/` — pure logic (schemas, broadcast utils, controllers in isolation)
- **E2E tests**: `tests/e2e/` — full HTTP flow against a real PostgreSQL DB
- Every new endpoint needs at least: happy path, validation failure, auth failure (401), not-found (404)
- Run: `npm run test:unit` / `npm run test:e2e`

### Firmware (PlatformIO Unity)

- Test parsing, UID conversion, and HTTP response handling in isolation
- Run: `pio test`


---

## Build & Run Commands

```bash
# Firmware
cd firmware && pio run                # Build
cd firmware && pio run -t upload      # Flash to ESP32
cd firmware && pio test               # Unit tests
cd firmware && pio device monitor     # Serial monitor

# Backend
cd web && npm install
cd web && npm run migrate             # Apply DB migrations
cd web && npm run dev                 # Dev server (hot reload)
cd web && npm run build               # Compile TypeScript
cd web && npm test                    # All tests
cd web && npm run test:unit
cd web && npm run test:e2e

```

---

## Hardware Wiring Reference

See `.github/instructions/wiring.instructions.md` for full pin assignments and ASCII diagrams.

**Summary (verified pins):**

| Module       | Module Pin | ESP32 GPIO |
|--------------|------------|------------|
| MFRC522      | SDA (SS)   | GPIO 5     |
| MFRC522      | SCK        | GPIO 18    |
| MFRC522      | MOSI       | GPIO 23    |
| MFRC522      | MISO       | GPIO 19    |
| MFRC522      | RST        | GPIO 4     |
| MFRC522      | GND        | GND        |
| MFRC522      | 3.3V       | 3V3        |
| OLED SSD1306 | GND        | GND        |
| OLED SSD1306 | VDD        | 3V3        |
| OLED SSD1306 | SCK        | GPIO 22    |
| OLED SSD1306 | SDA        | GPIO 21    |
| Relay        | IN         | GPIO 26 *(pending photo evidence)* |

**Critical warnings:**
- MFRC522 is **3.3V only** — never connect to 5V
- GPIOs 34–39 are **input-only** — do not use for output
- GPIOs 6–11 are **reserved** for internal flash — do not use
- All modules must share a **common GND**

---

## Hardware Photo Validation Protocol

Before providing wiring guidance or updating wiring documents:

1. Review photos in `.github/hardware pics/`
2. Validate module identity and pin labels from photos
3. Only include ASCII wiring diagrams for components **with photo evidence**
4. Mark unverified components as **Pending Hardware Evidence**

Current status: ESP32, MFRC522, OLED verified. Relay module **not yet verified**.

---

## Security Checklist (OWASP Top 10)

- [x] Parameterized queries (no SQL injection)
- [x] JWT authentication on all write endpoints
- [x] Input validation via Zod schemas
- [x] `helmet()` middleware for security headers
- [x] CORS restricted to known origins (`CORS_ORIGINS` env var)
- [x] Secrets in environment variables (`.env` not committed)
- [x] Error messages sanitized in production
- [ ] HTTPS in production (configure reverse proxy)
- [ ] Rate limiting on `/api/scan` (ESP32 endpoint)

---

## Beginner Context

The developer is learning IoT. When explaining hardware concepts (SPI, I2C, GPIO, interrupts, voltage levels):
- Explain "what it does" before "how it works"
- Use analogies and relate to the actual project hardware
- Show wiring in ASCII tables, not just code
- Keep explanations concise — 3–5 key points, offer to go deeper

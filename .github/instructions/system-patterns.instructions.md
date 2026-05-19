---
description: "System architecture, key technical decisions, design patterns, component relationships, and critical implementation paths."
---

# System Patterns — Smart Lock / Absensi RFID

## System Architecture

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
                            │   (Frontend)  │
                            └───────────────┘
```

## Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Firmware framework | PlatformIO + Arduino | Best library ecosystem for ESP32 |
| Backend language | TypeScript (Node.js) | Type safety, good ecosystem |
| Database | PostgreSQL | Relational, reliable, TIMESTAMPTZ support |
| Auth mechanism | JWT (HTTP header) | Stateless, easy to implement |
| Real-time updates | SSE (Server-Sent Events) | Simpler than WebSocket for one-way push |
| Input validation | Zod | Type-safe schemas, pairs well with TypeScript |
| JSON on ESP32 | ArduinoJson | Best ESP32 JSON library, streaming support |

## Design Patterns

### Backend: Route → Controller → Model

```
Request → routes/*.ts → controllers/*.ts → models/*.ts → PostgreSQL
```

### Middleware Stack Order

```
helmet() → cors() → express.json() → requireAuth() → routes → errorHandler()
```

### Async Error Propagation

```typescript
export async function handler(req, res, next): Promise<void> {
  try { ... } catch (err) { next(err); }
}
```

### Zod Validation Middleware

- Validate `req.body` against Zod schema before controller runs
- Return `400` with field errors on validation failure

### SSE Pattern

- Client connects to `GET /api/scan/stream?token=<jwt>`
- Server keeps connection open, writes `data: {...}\n\n` on each scan event
- `POST /api/scan` broadcasts to all connected SSE clients after DB insert

### Firmware: Non-blocking Loop

```cpp
void loop() {
  unsigned long now = millis();
  if (rfid.isNewCard()) { handleCard(); }
  if (relayUnlocked && now - relayTimer > RELAY_TIMEOUT_MS) { lockRelay(); }
  // Never: delay(1000);
}
```

### Firmware: Fail-Safe Access Control

```cpp
// Default: locked. Only unlock on explicit success response.
if (httpCode == 200 && response["access"] == true) {
  unlockRelay();
} else {
  // Stay locked — includes network errors, timeouts, unknown cards
}
```

### Firmware: WiFi Reconnect Pattern

```cpp
if (WiFi.status() != WL_CONNECTED) {
  reconnectWiFi();
  return; // Skip RFID read this cycle
}
```

## Component Relationships

```
firmware/src/main.cpp
  ├── uses → include/rfid.h      (MFRC522 read + UID formatting)
  ├── uses → include/display.h   (OLED write helpers)
  ├── uses → include/config.h    (pins, WiFi creds, API URL, timeouts)
  └── uses → relay logic         (inline or relay.h)

web/src/
  ├── index.ts                   (Express app setup, middleware, route mounting)
  ├── routes/scan.ts          → controllers/scanController.ts  → models/attendance.ts
  ├── routes/cards.ts         → controllers/cardController.ts  → models/card.ts
  ├── routes/users.ts         → controllers/userController.ts  → models/user.ts
  ├── routes/auth.ts          → controllers/authController.ts  → models/admin.ts
  ├── middleware/requireAuth.ts  (JWT verification)
  ├── middleware/validate.ts     (Zod schema validation)
  └── utils/broadcast.ts        (SSE client registry + broadcast)
```

## Critical Implementation Paths

### Card Scan Path (most critical)

```
ESP32 tap
  → POST /api/scan
  → validate body (card_uid required)
  → query cards table for card_uid
  → if found:  query user, record access_granted attendance
  → if not:    record access_denied attendance
  → broadcast SSE event to all connected dashboard clients
  → return { access, registered, user_name? }
  → ESP32: unlock relay OR show denied on OLED
```

### Authentication Path

```
POST /api/auth/login
  → validate credentials → bcrypt.compare
  → sign JWT (HS256, expires 24h) → return { token }

Subsequent requests:
  → Authorization: Bearer <token>
  → requireAuth middleware → jwt.verify → attach user to req
```

### Migration Path

```
src/models/migrate.ts
  → reads migrations/ dir
  → applies in filename order (001_, 002_, ...)
  → checks applied_migrations table to skip already-run migrations
  → run: npm run migrate
```

---
description: "Technologies used, development environment setup, technical constraints, dependencies, and tool usage patterns."
---

# Tech Context — Smart Lock / Absensi RFID

## Technology Stack

### Firmware (ESP32)

| Item | Detail |
|------|--------|
| Board | ESP32 DevKit V1 (CP2102, USB Type-C, 38 pins) |
| Framework | Arduino (via PlatformIO) |
| Build tool | PlatformIO (`pio run`, `pio test`, `pio run -t upload`, `pio device monitor`) |
| Key libraries | `miguelbalboa/MFRC522`, `adafruit/Adafruit SSD1306`, `adafruit/Adafruit GFX Library`, `ArduinoJson`, `WiFi.h` (built-in), `HTTPClient.h` (built-in) |
| Test framework | Unity (via PlatformIO `pio test`) |

### Backend (Web API)

| Item | Detail |
|------|--------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL |
| ORM/Query | Raw SQL with parameterized queries (no ORM) |
| Auth | JWT (`jsonwebtoken`), bcrypt (`bcrypt`) |
| Validation | Zod |
| Security | `helmet`, `cors` |
| Testing | Jest + Supertest |
| Dev server | `tsx` / `ts-node` with nodemon for hot reload |

### Frontend (Web Dashboard)

| Item | Detail |
|------|--------|
| Structure | Static HTML (`public/dashboard.html`) |
| Interactivity | Alpine.js |
| Styling | Tailwind CSS |
| Real-time | SSE (`EventSource` API) |
| Auth | JWT stored client-side, sent as `?token=` for SSE |

## Development Setup

### Prerequisites

- Node.js (LTS)
- PostgreSQL (running locally or via Docker)
- PlatformIO CLI or VS Code PlatformIO extension
- `.env` file in `web/` with all required secrets

### Required `.env` Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/smartlock
JWT_SECRET=your-secret-here
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
```

### First-time Setup

```bash
# Backend
cd web
npm install
cp .env.example .env    # fill in your values
npm run migrate          # create DB tables
npm run dev              # start dev server

# Firmware
cd firmware
pio run                  # build
pio run -t upload        # flash to ESP32
pio device monitor       # view serial output
```

## Technical Constraints

| Constraint | Detail |
|------------|--------|
| ESP32 memory | Limited RAM (~300KB) — avoid large JSON payloads |
| MFRC522 voltage | **3.3V ONLY** — 5V will damage it |
| GPIO 34-39 | Input-only — cannot drive relay or LEDs |
| GPIO 6-11 | Reserved for internal flash — do not use |
| `EventSource` | Cannot set custom headers — JWT via `?token=` query param |
| `delay()` | Never use in firmware loop — blocks all processing |
| Migrations | Numbered files only — never edit applied migrations |

## Key Dependencies

### Firmware (`platformio.ini` lib_deps)
```
miguelbalboa/MFRC522
adafruit/Adafruit SSD1306
adafruit/Adafruit GFX Library
bblanchon/ArduinoJson
```

### Backend (`web/package.json`)
```
express, typescript, ts-node, nodemon
pg (PostgreSQL client)
jsonwebtoken, bcrypt
zod
helmet, cors
jest, supertest (dev)
```

## Tool Usage Patterns

### PlatformIO Commands
```bash
pio run                  # Compile firmware
pio run -t upload        # Compile + flash to connected ESP32
pio device monitor       # Open serial monitor (115200 baud)
pio test                 # Run Unity unit tests
```

### npm Scripts (web/)
```bash
npm run dev              # Dev server with hot reload
npm run build            # Compile TypeScript → dist/
npm run migrate          # Apply pending DB migrations
npm run test             # All tests (unit + e2e)
npm run test:unit        # Unit tests only
npm run test:e2e         # E2E tests only (requires live DB)
```

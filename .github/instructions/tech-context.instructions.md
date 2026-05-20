---
description: "Technologies used, development environment setup, technical constraints, dependencies, and tool usage patterns."
---

# Tech Context — Smart Lock / Absensi RFID

## Technology Stack

### Firmware (ESP32)

| Item | Detail |
|------|--------|
| Board | ESP32 DevKit V1 |
| Framework | Arduino (PlatformIO) |
| Build tool | PlatformIO — `C:/Users/DELL/.platformio/penv/Scripts/pio.exe` if not in PATH |
| Key libraries | MFRC522, Adafruit SSD1306/GFX, ArduinoJson, **PubSubClient** (MQTT), WiFi.h, HTTPClient.h |
| Test framework | Unity (`pio test`) |

### Backend (Web API)

| Item | Detail |
|------|--------|
| Runtime | Node.js |
| Framework | Express.js (TypeScript) |
| Database | PostgreSQL (raw SQL, parameterized) |
| Auth | JWT + bcryptjs |
| MQTT client | `mqtt` npm package (subscriber only on server) |
| Validation | Zod |
| Testing | Jest + Supertest |

### Infrastructure

| Item | Detail |
|------|--------|
| MQTT broker | Eclipse Mosquitto via `docker compose up -d` (port 1883) |
| Config | `infra/mosquitto/mosquitto.conf` (anonymous dev) |

### Frontend

| Item | Detail |
|------|--------|
| Pages | `index.html`, `dashboard.html`, `access-logs.html`, `user-management.html`, `hardware.html` |
| Stack | Alpine.js, Tailwind CSS, SSE (`EventSource`) |

## Development Setup

### Prerequisites

- Node.js LTS, PostgreSQL, Docker (for MQTT broker), PlatformIO

### Required `.env` Variables (web/)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/smartlock
JWT_SECRET=your-secret-here
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000

# MQTT (optional — subscriber disabled if MQTT_URL unset)
MQTT_URL=mqtt://localhost:1883
MQTT_TELEMETRY_TOPIC=smartlock/ap/+/telemetry
MQTT_STATUS_TOPIC=smartlock/ap/+/status
# MQTT_ENABLED=false   # uncomment to disable without removing MQTT_URL
STALE_STATUS_THRESHOLD_SEC=120
STALE_STATUS_INTERVAL_MS=60000
```

### First-time Setup

```bash
# MQTT broker (repo root)
docker compose up -d

# Backend
cd web && npm install && cp .env.example .env
npm run migrate && npm run dev

# Test MQTT pipeline
npm run mqtt:test
node scripts/verify-mqtt-status.mjs 1

# Firmware — set MQTT_BROKER_HOST to broker LAN IP in include/config.h
cd firmware
pio run && pio run -t upload
```

### Firmware MQTT Config (`include/config.h`)

| Define | Purpose |
|--------|---------|
| `MQTT_BROKER_HOST` | Broker IP (LAN, not localhost from ESP32) |
| `MQTT_BROKER_PORT` | Default 1883 |
| `MQTT_CLIENT_ID` | Unique per device |
| `ACCESS_POINT_ID` | Must match DB `access_points.id` |
| `MQTT_TELEMETRY_INTERVAL_MS` | Default 60000 |
| `FIRMWARE_VERSION` | Shown on hardware dashboard |

## Technical Constraints

| Constraint | Detail |
|------------|--------|
| ESP32 `localhost` | Cannot reach host machine's localhost — use LAN IP for API and MQTT |
| MFRC522 | 3.3V only |
| GPIO 34-39 | Input-only |
| GPIO 6-11 | Flash reserved |
| EventSource | JWT via `?token=` only |
| MQTT buffer | PubSubClient buffer 512 bytes in `mqtt.h` |
| Migrations | Never edit applied migration files |

## Key Dependencies

### Firmware (`platformio.ini`)
```
miguelbalboa/MFRC522
adafruit/Adafruit SSD1306
adafruit/Adafruit GFX Library
bblanchon/ArduinoJson
knolleary/PubSubClient
```

### Backend (`package.json`)
```
express, pg, jsonwebtoken, bcryptjs, zod, helmet, cors, mqtt, dotenv
jest, supertest, tsx, nodemon (dev)
```

## npm Scripts (web/)

```bash
npm run dev              # Dev server
npm run build            # TypeScript compile
npm run migrate          # DB migrations
npm run mqtt:test        # Publish sample telemetry to broker
npm test / test:unit / test:e2e
```

## PlatformIO Commands

```bash
pio run                  # Build
pio run -t upload        # Flash
pio device monitor       # Serial 115200
pio test                 # Unit tests
```

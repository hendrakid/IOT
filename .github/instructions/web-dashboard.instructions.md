---
description: "Use when writing or modifying the web backend (Express.js API), web dashboard frontend, database models, or API routes. Covers Node.js, PostgreSQL, REST API, MQTT, and SSE patterns."
applyTo: "web/**"
---
# Web Dashboard & API Conventions

## Tech Stack

- Node.js + Express.js + TypeScript
- PostgreSQL (parameterized SQL, migrations in `src/models/migrations/`)
- MQTT subscriber (`mqtt` package) for hardware telemetry
- Jest + Supertest for tests

## Project Structure

```
web/
├── src/
│   ├── index.ts
│   ├── routes/           # auth, scan, cards, users, hardware, access-points, ...
│   ├── controllers/
│   ├── models/           # includes accessPointStatus.ts
│   ├── middleware/
│   └── utils/
│       ├── mqttSubscriber.ts
│       ├── staleStatusJob.ts
│       ├── scanBroadcast.ts
│       └── hardwareBroadcast.ts
├── scripts/
│   ├── mqtt-pub-test.mjs
│   └── verify-mqtt-status.mjs
├── public/               # hardware.html, app.js (isNodeOnline)
└── docs/api.md
```

## Core API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/scan` | No | ESP32 RFID tap → attendance + scan SSE |
| GET | `/api/scan/stream` | JWT* | Real-time scan events |
| GET | `/api/hardware/stream` | JWT* | Hardware status snapshot + MQTT updates |
| GET | `/api/access-points` | No | List access points (includes `status` when present) |
| GET | `/api/stats` | JWT | Dashboard summary counts |
| POST | `/api/auth/login` | No | Admin JWT |

\* SSE: `?token=<jwt>` (EventSource cannot set headers)

## MQTT (server-side)

- Started in `index.ts`: `startMqttSubscriber()`, `startStaleStatusJob()`
- Disabled if `MQTT_URL` unset or `MQTT_ENABLED=false`
- Topics (env): `MQTT_TELEMETRY_TOPIC`, `MQTT_STATUS_TOPIC` (default `smartlock/ap/+/telemetry|status`)
- Persists to `access_point_status`; broadcasts via `hardwareBroadcast`
- Dev test: `npm run mqtt:test`

## Database

- Migrations `001` … `012` (latest: `access_point_status`)
- `npm run migrate` — never edit applied migrations

## Security

- Zod validation on inputs
- JWT on write endpoints; scan endpoint unauthenticated (rate limited via `scanRateLimiter`)
- Secrets in `.env` only

## Scripts

```bash
npm run dev / build / migrate / test
npm run mqtt:test    # publish test telemetry
```

## Hardware Dashboard (`hardware.html`)

- Loads access points + opens `EventSource` on `/api/hardware/stream`
- `isNodeOnline(status)` in `app.js` — offline if `last_seen_at` > 120s or `online === false`

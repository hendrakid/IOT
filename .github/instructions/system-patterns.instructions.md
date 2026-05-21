---
description: "System architecture, key technical decisions, design patterns, component relationships, and critical implementation paths."
---

# System Patterns — Smart Lock / Absensi RFID

## System Architecture

```
┌─────────────┐  HTTP POST /api/scan      ┌──────────────────┐       ┌────────────────┐
│   ESP32     │ ─────────────────────────►│  REST API        │◄─────►│  PostgreSQL    │
│  + MFRC522  │◄──────── JSON ────────────│  (Express.js)    │       └────────────────┘
│  + OLED     │                           └────────┬─────────┘
└──────┬──────┘                                    │
       │ MQTT publish (telemetry / LWT status)     │ SSE /api/scan/stream
       ▼                                            │ SSE /api/hardware/stream
┌─────────────┐                                     ▼
│ MQTT Broker │◄── mqttSubscriber (Node)    ┌───────────────┐
│ (Mosquitto) │                             │ Web Dashboard │
└─────────────┘                             └───────────────┘
```

## Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Firmware framework | PlatformIO + Arduino | Best library ecosystem for ESP32 |
| Backend language | TypeScript (Node.js) | Type safety, good ecosystem |
| Database | PostgreSQL | Relational, reliable, TIMESTAMPTZ support |
| Auth mechanism | JWT (HTTP header) | Stateless, easy to implement |
| Card scan transport | HTTP POST | Request/response, immediate access decision |
| Hardware telemetry | MQTT publish/subscribe | Lightweight push, many devices, no polling |
| Real-time updates | SSE | Simpler than WebSocket for one-way push |
| Input validation | Zod | Type-safe schemas |
| JSON on ESP32 | ArduinoJson | Best ESP32 JSON library |

## Design Patterns

### Backend: Route → Controller → Model

```
Request → routes/*.ts → controllers/*.ts → models/*.ts → PostgreSQL
```

### MQTT Ingestion Path

```
ESP32 publish → Mosquitto → mqttSubscriber.on("message")
  → normalizePayload() → upsertAccessPointStatus()
  → broadcastHardwareEvent({ type: "status" })
  → SSE clients on GET /api/hardware/stream
```

### Stale Status Job

```
setInterval (60s) → markStaleAccessPointsOffline(120s)
  → UPDATE online=false WHERE last_seen_at too old
  → broadcastHardwareEvent per changed row
```

### SSE Patterns

- **Scan**: `GET /api/scan/stream?token=` — events from `POST /api/scan`
- **Hardware**: `GET /api/hardware/stream?token=` — snapshot on connect, then MQTT-driven `status` events

### Firmware: Non-blocking Loop

```cpp
void loop() {
  loopMqtt();  // always first — maintain broker connection
  // RFID / OLED / HTTP scan handling...
}
```

### Firmware: Fail-Safe Access Control

HTTP scan errors → deny access + `lockRelay()`. Access granted → `unlockRelay()` then auto-lock via `loopRelay()`. MQTT failures do not block scan path.

## Component Relationships

```
firmware/src/main.cpp
  ├── include/rfid.h       (MFRC522)
  ├── include/display.h    (OLED)
  ├── include/led.h        (status LEDs)
  ├── include/relay.h      (door lock relay, GPIO 26)
  ├── include/mqtt.h       (PubSubClient telemetry + LWT)
  └── include/config.h     (WiFi, API URL, MQTT broker, ACCESS_POINT_ID)

web/src/
  ├── index.ts
  ├── utils/mqttSubscriber.ts    → models/accessPointStatus.ts
  ├── utils/staleStatusJob.ts    → models/accessPointStatus.ts
  ├── utils/hardwareBroadcast.ts → routes/hardware.ts
  ├── utils/scanBroadcast.ts     → routes/scan.ts
  └── routes/scan.ts → controllers/scanController.ts
```

## Critical Implementation Paths

### Card Scan Path (HTTP)

```
ESP32 tap → POST /api/scan { uid, access_point_id }
  → validate → cards lookup → attendance insert
  → broadcastScan SSE → return { access, registered, user_name }
```

### Hardware Telemetry Path (MQTT)

```
ESP32 (every 60s) → smartlock/ap/<id>/telemetry
  → mqttSubscriber → access_point_status upsert
  → hardware SSE → hardware.html UI (isNodeOnline: 120s threshold)
```

### Authentication Path

```
POST /api/auth/login → JWT
Protected routes → Authorization: Bearer <token>
SSE routes → ?token=<jwt>
```

### Migration Path

Migrations `001_` … `012_` applied in order via `npm run migrate`.

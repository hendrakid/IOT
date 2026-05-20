# API Documentation - Smart Lock / Absensi RFID

All endpoints are prefixed with `/api`.

---

## Authentication

### POST `/api/auth/login`
- Description: Login as admin and return JWT token.
- Auth: Not required
- Body:
```json
{
	"username": "admin",
	"password": "secret123"
}
```

- Success response:
```json
{
	"success": true,
	"data": {
		"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
	}
}
```

---

## Users

### GET `/api/users`
- Auth: Required (admin)
- Description: List all users.

Sample response:
```json
{
	"success": true,
	"data": [
		{
			"id": 2,
			"name": "Budi",
			"email": "budi@test.com",
			"role": "member",
			"created_at": "2026-05-18T08:00:00.000Z"
		}
	]
}
```

### POST `/api/users`
- Auth: Required (admin)
- Description: Create a user.
- Body:
```json
{
	"name": "Budi",
	"email": "budi@test.com",
	"role": "member",
	"access_point_ids": [1, 2]
}
```

- Success response (201):
```json
{
	"success": true,
	"data": {
		"id": 2,
		"name": "Budi",
		"email": "budi@test.com",
		"role": "member",
		"created_at": "2026-05-18T08:00:00.000Z"
	}
}
```

### PUT `/api/users/:id`
- Auth: Required (admin)
- Description: Update user fields and/or replace user access points.
- Body (all optional):
```json
{
	"name": "Budi Santoso",
	"email": "budi.santoso@test.com",
	"role": "staff",
	"access_point_ids": [1]
}
```

### DELETE `/api/users/:id`
- Auth: Required (admin)
- Description: Delete user.
- Success response:
```json
{
	"success": true,
	"data": null
}
```

### User Access (nested)
- GET `/api/users/:user_id/access-points` - List access points granted to user.
- POST `/api/users/:user_id/access-points` - Grant access.
- DELETE `/api/users/:user_id/access-points` - Revoke access.

Body for POST/DELETE:
```json
{
	"access_point_id": 2
}
```

---

## Cards

### GET `/api/cards?page=1&limit=20`
- Auth: Required (admin)
- Description: List cards (paginated).

Sample response:
```json
{
	"success": true,
	"data": [
		{
			"id": 10,
			"card_uid": "A1B2C3D4",
			"label": "Kartu Budi",
			"created_at": "2026-05-18T08:00:00.000Z",
			"user_id": 2,
			"user_name": "Budi",
			"user_email": "budi@test.com"
		}
	],
	"meta": {
		"page": 1,
		"limit": 20,
		"total": 1
	}
}
```

### POST `/api/cards`
- Auth: Required (admin)
- Description: Register a new card.
- Body:
```json
{
	"card_uid": "A1B2C3D4",
	"label": "Kartu Budi",
	"user_id": 2
}
```

### DELETE `/api/cards/:id`
- Auth: Required (admin)
- Description: Delete card by ID.

---

## Attendance

### GET `/api/attendance`
- Auth: Required (admin)
- Description: List attendance (paginated) with optional filters.
- Query params (optional): `page`, `limit`, `from`, `to`, `action`, `search`, `access_point_id`
- `action` allowed values: `tap`, `access_granted`, `access_denied`

Sample response:
```json
{
	"success": true,
	"data": [
		{
			"id": 1,
			"card_uid": "A1B2C3D4",
			"action": "access_granted",
			"timestamp": "2026-05-18T08:00:00.000Z",
			"access_point_id": 1,
			"user_id": 2,
			"user_name": "Budi",
			"access_point_name": "Main Door"
		}
	],
	"meta": {
		"page": 1,
		"limit": 20,
		"total": 1
	}
}
```

### POST `/api/attendance`
- Auth: Not required (used by ESP32)
- Description: Record attendance event.
- Body:
```json
{
	"card_uid": "A1B2C3D4",
	"action": "tap",
	"access_point_id": 1
}
```

Notes:
- If `action` is `tap`, backend resolves final action automatically:
	- registered card -> `access_granted`
	- unregistered card -> `access_denied`

Success response (201):
```json
{
	"success": true,
	"data": {
		"id": 1,
		"card_uid": "A1B2C3D4",
		"user_id": 2,
		"action": "access_granted",
		"access_point_id": 1,
		"timestamp": "2026-05-18T08:00:00.000Z"
	},
	"access": true
}
```

---

## Scan

### POST `/api/scan`
- Auth: Not required (used by ESP32)
- Description: Handle card tap, optional access check by access point, write attendance log, and broadcast SSE event.
- Body:
```json
{
	"uid": "A1B2C3D4",
	"access_point_id": 1
}
```

Behavior:
- If `access_point_id` is provided and card is registered, backend checks user access for that point.
- If `access_point_id` is not provided, backend only reports registration status.

Sample response (with access check):
```json
{
	"success": true,
	"data": {
		"uid": "A1B2C3D4",
		"access": true,
		"registered": true,
		"user_name": "Budi",
		"checked": true
	}
}
```

Sample response (without access_point_id):
```json
{
	"success": true,
	"data": {
		"uid": "A1B2C3D4",
		"access": false,
		"registered": true,
		"user_name": "Budi",
		"checked": false
	}
}
```

### GET `/api/scan/stream?token=<jwt>`
- Auth: JWT token via query parameter (EventSource limitation)
- Description: SSE endpoint for real-time scan events on admin pages.
- Query params:
  - `access_point_id` (required for delivery): client anchor ID
  - `include` (optional): comma-separated AP IDs — only events from these APs
  - `exclude` (optional): comma-separated AP IDs — events from APs not in this list

Sample SSE event payload:
```text
data: {"uid":"A1B2C3D4","registered":true,"user_name":"Budi","access_point_id":2,"access_point_name":"Main Door","action":"access_granted","timestamp":"2026-05-18T08:00:00.000Z"}
```

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | RFID card UID |
| `registered` | boolean | Whether the card is registered |
| `user_name` | string? | User name if registered |
| `access_point_id` | number? | Access point where the tap occurred |
| `access_point_name` | string? | Human-readable access point name |
| `action` | string | `access_granted`, `access_denied`, or `tap` |
| `timestamp` | string | ISO 8601 event time |

---

## Config

### GET `/api/config`
- Auth: Not required
- Description: Public SSE filter config for admin pages (derived from server environment).

Environment variable:

| Variable | Default | Usage |
|----------|---------|--------|
| `SSE_REGISTRATION_ACCESS_POINT_IDS` | `1` | Comma-separated registration scanner AP IDs. User Management uses `include`; Access Logs and Dashboard use `exclude`. |

Sample response:
```json
{
	"success": true,
	"data": {
		"registrationAccessPointIds": [1],
		"userManagement": { "include": [1] },
		"accessLogs": { "exclude": [1] },
		"dashboard": { "exclude": [1] },
		"accessPointId": 1
	}
}
```

---

## Access Points

### GET `/api/access-points`
- Auth: Not required
- Description: List all access points.

Sample response:
```json
{
	"success": true,
	"accessPoints": [
		{
			"id": 1,
			"name": "Main Door",
			"type": "door",
			"location": "Lobby",
			"created_at": "2026-05-18T08:00:00.000Z"
		}
	]
}
```

### GET `/api/access-points/card/:cardId`
- Auth: Not required
- Description: List access points assigned to the card owner.

Sample response:
```json
{
	"accessPoints": [
		{
			"id": 1,
			"name": "Main Door"
		}
	]
}
```

### POST `/api/access-points`
- Auth: Required (admin)
- Body:
```json
{
	"name": "Lab",
	"type": "door",
	"location": "2nd Floor"
}
```

### PUT `/api/access-points/:id`
- Auth: Required (admin)
- Body (optional fields):
```json
{
	"name": "Lab Komputer",
	"type": "door",
	"location": "3rd Floor"
}
```

### DELETE `/api/access-points/:id`
- Auth: Required (admin)

`GET /api/access-points` includes optional `status` per node when telemetry has been received.

---

## Hardware (Realtime)

### GET `/api/hardware/stream`
- Auth: Required (admin JWT via query `?token=...` — EventSource cannot set headers)
- Description: Server-Sent Events stream for access point status/telemetry. Sends an initial `snapshot`, then `status` events when MQTT messages arrive.

Sample SSE event (snapshot):
```json
{
  "type": "snapshot",
  "data": [
    {
      "id": 1,
      "name": "Main Door",
      "type": "door",
      "location": "Lobby",
      "created_at": "2026-05-18T08:00:00.000Z",
      "status": {
        "access_point_id": 1,
        "online": true,
        "last_seen_at": "2026-05-20T10:00:00.000Z",
        "ip_address": "192.168.1.50",
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "firmware_version": "1.2.0",
        "battery_percent": 85,
        "signal_dbm": -62,
        "core_temp_c": 42.5,
        "updated_at": "2026-05-20T10:00:00.000Z"
      }
    }
  ],
  "timestamp": "2026-05-20T10:00:01.000Z"
}
```

Sample SSE event (live update):
```json
{
  "type": "status",
  "data": {
    "access_point_id": 1,
    "online": true,
    "last_seen_at": "2026-05-20T10:05:00.000Z",
    "firmware_version": "1.2.0",
    "battery_percent": 84,
    "signal_dbm": -65,
    "core_temp_c": 43.0
  },
  "timestamp": "2026-05-20T10:05:00.000Z"
}
```

### MQTT payload (ESP32 → broker)

Server subscribes when `MQTT_URL` is set. Topic patterns (configurable via env):

| Topic pattern | Example |
|---------------|---------|
| `MQTT_TELEMETRY_TOPIC` | `smartlock/ap/+/telemetry` |
| `MQTT_STATUS_TOPIC` | `smartlock/ap/+/status` |

Access point ID is taken from topic segment `smartlock/ap/<id>/...` or from JSON field `access_point_id`.

Sample JSON payload:
```json
{
  "access_point_id": 1,
  "online": true,
  "status": "online",
  "ip_address": "192.168.1.50",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "firmware_version": "1.2.0",
  "battery_percent": 85,
  "signal_dbm": -62,
  "core_temp_c": 42.5
}
```

Offline example (`MQTT_STATUS_TOPIC`):
```json
{
  "access_point_id": 1,
  "online": false,
  "status": "offline"
}
```

Environment variables:

| Variable | Default | Usage |
|----------|---------|--------|
| `MQTT_URL` | _(unset)_ | Broker URL; subscriber disabled if unset |
| `MQTT_USERNAME` | _(unset)_ | Optional |
| `MQTT_PASSWORD` | _(unset)_ | Optional |
| `MQTT_TELEMETRY_TOPIC` | `smartlock/ap/+/telemetry` | Subscribe pattern |
| `MQTT_STATUS_TOPIC` | `smartlock/ap/+/status` | Subscribe pattern |
| `MQTT_ENABLED` | _(enabled)_ | Set `false` to disable subscriber |
| `STALE_STATUS_THRESHOLD_SEC` | `120` | Server marks `online=false` when `last_seen_at` is older |
| `STALE_STATUS_INTERVAL_MS` | `60000` | How often the stale-status job runs |

UI treats a node as offline if `last_seen_at` is older than 2 minutes. The server also sets `online=false` in the database on the same threshold via a background job.

**Dev broker:** `docker compose up -d` from repo root; test with `cd web && npm run mqtt:test`.

---

## Firmware & OTA (planned)

Not implemented yet. Planned contract:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/firmware` | Admin | Upload firmware binary + metadata (version, changelog) |
| GET | `/api/access-points/:id/firmware` | Admin | Current vs target firmware version |
| POST | `/api/access-points/:id/firmware/assign` | Admin | Assign target version for OTA |
| GET | `/api/device/:deviceId/ota` | Device API key | Node polls for pending update |
| POST | `/api/device/:deviceId/ota/progress` | Device API key | Node reports download/flash progress |

Device auth should use per-node `device_id` + API key (not admin JWT).

---

## Stats

### GET `/api/stats`
- Auth: Required (admin)
- Description: Get dashboard statistics.

Sample response:
```json
{
	"success": true,
	"data": {
		"totalUsers": 10,
		"totalCards": 8,
		"successRate": 92.5,
		"unregisteredScans": 3,
		"recentActivity": [
			{
				"id": 101,
				"card_uid": "A1B2C3D4",
				"action": "access_granted",
				"timestamp": "2026-05-18T08:00:00.000Z",
				"user_name": "Budi"
			}
		]
	}
}
```

---

## Notes
- Most endpoints require JWT auth via `Authorization: Bearer <token>`.
- Public endpoints: `POST /api/auth/login`, `POST /api/attendance`, `POST /api/scan`, `GET /api/config`, `GET /api/scan/stream` (token in query), `GET /api/hardware/stream` (token in query), `GET /api/access-points`, `GET /api/access-points/card/:cardId`.
- Validation is enforced with Zod schemas.
- Main response pattern is `{ success: boolean, data: ... }`, with some legacy endpoints returning `accessPoints` at top level.

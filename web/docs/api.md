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
- Description: SSE endpoint for real-time scan events on dashboard.

Sample SSE event payload:
```text
data: {"uid":"A1B2C3D4","registered":true,"user_name":"Budi","timestamp":"2026-05-18T08:00:00.000Z"}
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
- Public endpoints: `POST /api/auth/login`, `POST /api/attendance`, `POST /api/scan`, `GET /api/scan/stream` (token in query), `GET /api/access-points`, `GET /api/access-points/card/:cardId`.
- Validation is enforced with Zod schemas.
- Main response pattern is `{ success: boolean, data: ... }`, with some legacy endpoints returning `accessPoints` at top level.

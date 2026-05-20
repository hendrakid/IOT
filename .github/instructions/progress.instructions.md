---
description: "Use when asking about project progress, current status, completed milestones, next steps, learning roadmap, or what has been done so far in the Smart Lock / Absensi RFID project."
---
# Project Progress Tracker

## Learning Roadmap

| Phase | Title | Status | Description |
|-------|-------|--------|-------------|
| 1 | Hardware Setup & Verification | Completed | Wire all components, verify each works individually |
| 2 | RFID Card Reading | Completed | Read card UIDs, display on Serial & OLED |
| 3 | Relay Control | Not Started | Control relay based on card read, implement lock/unlock logic |
| 4 | WiFi & HTTP Communication | Completed | Connect ESP32 to WiFi, send data to API |
| 5 | Backend API Development | Completed | Build Express.js REST API with PostgreSQL |
| 6 | Full Integration (ESP32 ↔ API) | Completed | ESP32 sends attendance, receives access decisions from API |
| 7 | Web Dashboard | Completed | Build admin dashboard for card/user/attendance management |
| 8 | MQTT Hardware Monitoring | Completed | Telemetry via Mosquitto, DB status, hardware SSE dashboard |
| 9 | Security & Hardening | In Progress | JWT auth, Zod validation, rate limiting, HTTPS |
| 10 | Testing & Documentation | In Progress | Unit tests, E2E tests, final documentation |

## Current Phase

**Phase**: 9 — Security & Hardening (In Progress)

**Current Focus**: MQTT stack complete (broker, subscriber, firmware publisher, `hardware.html`). Next priorities: rate limiting on `/api/scan`, relay integration (blocked on hardware photo), E2E tests for scan/MQTT/hardware, HTTPS for production.

## Completed Milestones

- [x] ESP32 blinks LED (board works)
- [x] OLED displays text (I2C works)
- [x] MFRC522 reads card UID (SPI works)
- [ ] Relay toggles on/off (GPIO works) — blocked on hardware photo
- [x] ESP32 connects to WiFi
- [x] ESP32 sends HTTP POST to API (`POST /api/scan`)
- [x] Express API receives and stores attendance
- [x] Web dashboard displays attendance records
- [x] Full system integration working end-to-end (RFID scan path)
- [x] MQTT broker + server subscriber + `access_point_status` table
- [x] Firmware MQTT telemetry publisher + LWT offline
- [x] Hardware dashboard (`/hardware`) with live SSE status

## Integration Details

### Phase 6 — RFID / HTTP (Completed)
- `POST /api/scan` — no JWT; checks card, records attendance, returns access decision
- SSE `GET /api/scan/stream` — real-time scan events to dashboard
- Firmware: WiFi + HTTPClient + ArduinoJson; OLED shows scan results

### Phase 8 — MQTT / Hardware (Completed May 2026)
- Topics: `smartlock/ap/<id>/telemetry`, `smartlock/ap/<id>/status`
- Server: `mqttSubscriber.ts` → `upsertAccessPointStatus` → `hardwareBroadcast` → `GET /api/hardware/stream`
- Stale job: marks offline after 120s without telemetry
- Dev broker: `docker compose up -d`; test: `cd web && npm run mqtt:test`
- Firmware: `mqtt.h` (PubSubClient), heartbeat every 60s, config in `config.h`

## Known Issues / Blockers

- Relay module photo not in `.github/hardware pics/` — relay wiring and GPIO logic not implemented
- Rate limiting on `POST /api/scan` not implemented
- No E2E tests for MQTT subscriber or hardware SSE
- OTA firmware endpoints planned only (see `web/docs/api.md`)

## Notes

- Update this file as milestones complete
- Migration count: `001` … `012` (latest: `access_point_status`)

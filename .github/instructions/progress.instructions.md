---
description: "Use when asking about project progress, current status, completed milestones, next steps, learning roadmap, or what has been done so far in the Smart Lock / Absensi RFID project."
---
# Project Progress Tracker

## Learning Roadmap

| Phase | Title | Status | Description |
|-------|-------|--------|-------------|
| 1 | Hardware Setup & Verification | Completed | Wire all components, verify each works individually |
| 2 | RFID Card Reading | Completed | Read card UIDs, display on Serial & OLED |
| 3 | Relay Control | Completed | GPIO 26 relay unlock on access granted, auto-lock via millis() |
| 4 | WiFi & HTTP Communication | Completed | Connect ESP32 to WiFi, send data to API |
| 5 | Backend API Development | Completed | Build Express.js REST API with PostgreSQL |
| 6 | Full Integration (ESP32 ↔ API) | Completed | ESP32 sends attendance, receives access decisions from API |
| 7 | Web Dashboard | Completed | Build admin dashboard for card/user/attendance management |
| 8 | MQTT Hardware Monitoring | Completed | Telemetry via Mosquitto, DB status, hardware SSE dashboard |
| 9 | Security & Hardening | In Progress | JWT auth, Zod validation, rate limiting, HTTPS |
| 10 | Testing & Documentation | In Progress | Unit tests, E2E tests, final documentation |

## Current Phase

**Phase**: 9 — Security & Hardening (In Progress)

**Current Focus**: Relay control implemented. Next: unit tests `hardwareBroadcast`/`staleStatusJob`, OTA, HTTPS, CI/CD, hardware docs.

## Completed Milestones

- [x] ESP32 blinks LED (board works)
- [x] OLED displays text (I2C works)
- [x] MFRC522 reads card UID (SPI works)
- [x] Relay toggles on/off (GPIO 26, unlock on access granted)
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

## TODO

### Prioritas tinggi (security & stabilitas)

- [x] **Rate limiting** on `POST /api/scan` — `scanRateLimiter` middleware; env `SCAN_RATE_LIMIT_*`; unit test `scanRateLimit.test.ts`
- [x] **Firmware deploy** — `firmware/include/config.h.example` + checklist di README; manual: set LAN IP di `config.h`, PlatformIO upload
- [x] **E2E tests** — `scan.e2e.ts`, `mqttHardware.e2e.ts`; unit `mqttSubscriber.test.ts`; scripts `test:e2e`, `test:e2e:mqtt`

### Prioritas menengah (fitur inti belum lengkap)

- [x] **Relay integration** — `include/relay.h`, GPIO 26, unlock on access granted, fail-to-locked on error
- [ ] **Unit tests (web)** — `hardwareBroadcast`, `staleStatusJob` (done: `scanController`, `schemas`, `scanBroadcast`, `sseEnv`, `scanRateLimit`, `mqttSubscriber`)

### Prioritas rendah (production & polish)

- [ ] **OTA firmware** — planned endpoints in `web/docs/api.md` (assign version, poll, progress); not built
- [ ] **HTTPS** — production reverse proxy (Nginx/Caddy)
- [ ] **CI/CD** — GitHub Actions workflow (build, test, lint); `.github/workflows/` not yet created
- [ ] **Hardware docs** — populate repo `docs/` with wiring diagrams and schematics (folder currently empty; README references it)
- [ ] **Firmware unit tests** — PlatformIO Unity tests in `firmware/test/` (framework configured in `tech-context`, no tests written yet)

## Known Issues / Blockers

- OTA firmware endpoints planned only (see `web/docs/api.md`)
- No CI/CD pipeline (`.github/workflows/` missing)
- Repo `docs/` folder empty — hardware schematics not yet added
- No firmware unit tests (`firmware/test/` empty)

## Notes

- Update this file as milestones complete
- Migration count: `001` … `012` (latest: `access_point_status`)

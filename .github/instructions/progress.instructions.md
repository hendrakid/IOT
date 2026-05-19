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
| 8 | Security & Hardening | In Progress | JWT auth, Zod validation, rate limiting, HTTPS |
| 9 | Testing & Documentation | In Progress | Unit tests, E2E tests, final documentation |

## Current Phase

**Phase**: 8 — Security & Hardening (In Progress)

**Current Focus**: Authentication middleware live on all protected API routes; input validation via Zod schemas. Relay wiring still pending hardware photo evidence. Next: relay integration, rate limiting on `/api/scan`, then HTTPS setup.

## Completed Milestones

- [x] ESP32 blinks LED (board works)
- [x] OLED displays text (I2C works)
- [x] MFRC522 reads card UID (SPI works)
- [ ] Relay toggles on/off (GPIO works)
- [x] ESP32 connects to WiFi
- [x] ESP32 sends HTTP POST to API
- [x] Express API receives and stores attendance
- [x] Web dashboard displays attendance records
- [x] Full system integration working end-to-end

## Integration Details (Phase 6 — Completed May 2026)

- `POST /api/scan` is the single ESP32 entry point (no JWT required)
- Backend checks if card UID exists in `cards` table:
  - **Registered** → records attendance (`access_granted`), returns `{access: true, registered: true, user_name}`
  - **Unknown** → records attendance (`access_denied`), returns `{access: false, registered: false}`
- SSE stream (`GET /api/scan/stream`) broadcasts scan events to dashboard in real-time
- Dashboard auto-switches to Kartu tab + pre-fills UID when unknown card is tapped
- Dashboard shows kehadiran toast when known card is tapped
- Firmware: WiFi + HTTPClient + ArduinoJson; OLED shows Connected/IP on boot, then scan result with user name per tap

## Known Issues / Blockers

- Relay module photo/hardware evidence is not available yet in `.github/hardware pics`, so relay ASCII pinout/wiring cannot be finalized and relay control logic in firmware is not yet implemented.

## Notes

- Update this file as you complete each milestone
- Mark phase status: Not Started → In Progress → Completed
- Add issues/blockers as they arise

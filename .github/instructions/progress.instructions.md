---
description: "Use when asking about project progress, current status, completed milestones, next steps, learning roadmap, or what has been done so far in the Smart Lock / Absensi RFID project."
---
# Project Progress Tracker

## Learning Roadmap

| Phase | Title | Status | Description |
|-------|-------|--------|-------------|
| 1 | Hardware Setup & Verification | In Progress | Wire all components, verify each works individually |
| 2 | RFID Card Reading | Completed | Read card UIDs, display on Serial & OLED |
| 3 | Relay Control | Not Started | Control relay based on card read, implement lock/unlock logic |
| 4 | WiFi & HTTP Communication | Not Started | Connect ESP32 to WiFi, send data to API |
| 5 | Backend API Development | Not Started | Build Express.js REST API with PostgreSQL |
| 6 | Full Integration (ESP32 ↔ API) | Not Started | ESP32 sends attendance, receives access decisions from API |
| 7 | Web Dashboard | Not Started | Build admin dashboard for card/user/attendance management |
| 8 | Android App | Not Started | Build mobile app for monitoring and management |
| 9 | Security & Hardening | Not Started | Add authentication, HTTPS, input validation |
| 10 | Testing & Documentation | Not Started | Unit tests, E2E tests, final documentation |

## Current Phase

**Phase**: 1 — Hardware Setup & Verification (In Progress)

**Current Focus**: OLED + RFID wiring verified on ESP32; whitelist-based Access Granted/Denied logic implemented. Next: relay module integration (after hardware evidence is available).

## Completed Milestones

- [ ] ESP32 blinks LED (board works)
- [x] OLED displays text (I2C works)
- [x] MFRC522 reads card UID (SPI works)
- [ ] Relay toggles on/off (GPIO works)
- [ ] ESP32 connects to WiFi
- [ ] ESP32 sends HTTP POST to API
- [ ] Express API receives and stores attendance
- [ ] Web dashboard displays attendance records
- [ ] Android app shows attendance list
- [ ] Full system integration working end-to-end

## Known Issues / Blockers

- Relay module photo/hardware evidence is not available yet in `.github/hardware pics`, so relay ASCII pinout/wiring cannot be finalized.

## Notes

- Update this file as you complete each milestone
- Mark phase status: Not Started → In Progress → Completed
- Add issues/blockers as they arise

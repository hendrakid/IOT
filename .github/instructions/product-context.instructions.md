---
description: "Why this project exists, the problems it solves, and user experience goals. Read to understand motivation and intended behavior."
---

# Product Context — Smart Lock / Absensi RFID

## Why This Project Exists

A learning project to understand IoT end-to-end: from physical hardware (RFID, relay, OLED) to embedded firmware (ESP32/Arduino) to backend services (Node.js/PostgreSQL) to web dashboards.

The project solves a real-world problem: managing physical access to a door and automatically recording attendance — replacing manual key/logbook systems.

## Problems It Solves

| Problem | Solution |
|---------|----------|
| Manual attendance recording (error-prone) | Automatic logging on every RFID tap |
| No visibility on who accessed the door | Real-time dashboard with full history |
| Lost/stolen keys grant permanent access | Deactivate a card instantly via dashboard |
| Unknown cards create security risks | Unknown taps recorded and flagged for quick registration |

## How It Should Work

### Normal Flow (Authorized User)
1. User taps registered RFID card on reader
2. ESP32 reads UID, POSTs to `POST /api/scan`
3. API checks card → finds registered user → records `access_granted` attendance
4. API returns `{ access: true, user_name: "..." }`
5. ESP32: unlocks relay for N seconds, shows user name on OLED
6. Dashboard: shows real-time toast notification via SSE

### Unknown Card Flow
1. User taps unregistered card
2. ESP32 POSTs UID to `POST /api/scan`
3. API records `access_denied` attendance
4. API returns `{ access: false, registered: false }`
5. ESP32: keeps relay locked, shows "Access Denied" on OLED
6. Dashboard: auto-switches to Cards tab, pre-fills UID for quick registration

### Hardware Monitoring Flow
1. ESP32 publishes telemetry every 60s to MQTT (`smartlock/ap/<id>/telemetry`)
2. Server subscriber upserts `access_point_status` and pushes SSE to `/hardware`
3. Admin opens **Hardware** page — sees online/offline, IP, RSSI, firmware version
4. If no telemetry for 120s, UI and server mark node offline (stale job)

### Admin Management Flow
1. Admin logs in → receives JWT
2. Admin registers new cards, creates users, assigns access points
3. Admin views attendance history with filters
4. All modifications require valid JWT

## User Experience Goals

- **Responsive feedback**: Card tap should show OLED result in < 2 seconds
- **Fail-safe**: System must always fail to locked state — never grant on error
- **Real-time**: Dashboard updates without manual refresh via SSE
- **Simple admin UI**: One-page dashboard with tabs (Attendance, Cards, Users)

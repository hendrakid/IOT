---
description: "Foundation document for the Smart Lock / Absensi RFID project. Read this FIRST to understand project scope, goals, and core requirements."
---

# Project Brief — Smart Lock / Absensi RFID

## Project Purpose

Build an IoT-based Smart Lock & RFID Attendance system as a learning project. The system allows authorized users to unlock a door by tapping an RFID card, while logging all access events to a web-accessible database.

## Core Requirements

1. **RFID Access Control** — ESP32 reads RFID card UIDs via MFRC522, checks authorization against backend, controls a relay (door lock)
2. **Attendance Logging** — Every card tap (authorized or not) is recorded to PostgreSQL with timestamp, card UID, and user identity
3. **Real-time Dashboard** — Admin web dashboard shows live scan events via SSE, manages cards/users/attendance
4. **REST API** — Express.js backend serves both the ESP32 firmware and the web dashboard
5. **Admin Authentication** — Dashboard and data-modification endpoints require JWT login

## Project Scope

| In Scope | Out of Scope |
|----------|-------------|
| ESP32 firmware (RFID, OLED, Relay, WiFi) | Mobile app (planned Phase 8, not started) |
| Express.js REST API (TypeScript) | Cloud deployment / HTTPS (planned) |
| PostgreSQL database + migrations | Multi-tenant / multi-site support |
| Web dashboard (HTML/Alpine.js/Tailwind) | BLE or other communication protocols |
| Admin JWT authentication | Third-party SSO |

## Success Criteria

- ESP32 correctly grants/denies access based on card registration status
- All card taps are logged with correct user identity and timestamp
- Dashboard updates in real-time when a card is tapped (SSE)
- Admin can register cards, create users, view attendance via dashboard
- System denies access and fails safe (locked) if WiFi/API is unreachable

## Developer Context

The developer is **learning IoT** — this is both a functional project and a learning experience. When asked about hardware concepts (SPI, I2C, GPIO, voltage levels), prioritize understanding over brevity.

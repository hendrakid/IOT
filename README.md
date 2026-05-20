# Smart Lock / Absensi RFID — IoT Project

## Overview
This project is an IoT-based Smart Lock and Attendance system using RFID. It features an ESP32 microcontroller that reads RFID cards, displays status on an OLED, controls a relay (door lock), and sends attendance data via WiFi to a REST API backed by PostgreSQL. A web dashboard provides management and monitoring.

## Architecture

```
┌─────────────┐  WiFi/HTTP POST /api/scan   ┌──────────────────┐       ┌────────────────┐
│   ESP32     │ ────────────────────────────►│  REST API        │◄─────►│  PostgreSQL    │
│  + MFRC522  │◄──────── JSON ──────────────│  (Express.js)    │       └────────────────┘
│  + OLED     │                              └────────┬─────────┘
└──────┬──────┘                                       │
       │ MQTT publish (telemetry / status)            │ SSE /api/hardware/stream
       ▼                                              ▼
┌─────────────┐                              ┌───────────────┐
│ MQTT Broker │◄── subscriber (Node mqtt) ──│ Web Dashboard │
│ (Mosquitto) │                              │ (Frontend)    │
└─────────────┘                              └───────────────┘
```

- **HTTP** — RFID tap → access decision (`POST /api/scan`)
- **MQTT** — periodic node telemetry (`smartlock/ap/<id>/telemetry`) and LWT offline on `.../status`

## Folder Structure

```
/
├── firmware/          # ESP32 PlatformIO project
├── web/               # Express.js backend + web dashboard
├── docs/              # Documentation, schematics
└── .github/           # Copilot instructions, CI/CD
```

## Tech Stack

| Component      | Technology                                  |
| -------------- | ------------------------------------------- |
| Microcontroller| ESP32 DevKit V1 (Arduino/PlatformIO)        |
| RFID Module    | MFRC522 (SPI)                              |
| Display        | OLED 0.96" 128x64 SSD1306 (I2C)             |
| Actuator       | 5V Relay Module                             |
| Backend API    | Node.js + Express.js                        |
| Database       | PostgreSQL                                  |
| Web Dashboard  | HTML/CSS/JS (Alpine.js + Tailwind CSS)      |

## Key Features
- RFID-based attendance and access control
- Real-time status display on OLED
- Secure relay control for door lock
- RESTful API for attendance and user management
- Web dashboard for monitoring and admin

## Getting Started

### Firmware
- See `firmware/` for ESP32 code (PlatformIO)
- Build: `cd firmware && pio run`
- Upload: `cd firmware && pio run -t upload`
- Test: `cd firmware && pio test`

### Backend
- See `web/` for Express.js API and dashboard
- Install: `cd web && npm install`
- Run: `cd web && npm run dev`
- Test: `cd web && npm test`

### MQTT (hardware telemetry)
1. Start broker: `docker compose up -d` (from repo root)
2. Set `MQTT_URL=mqtt://localhost:1883` in `web/.env` (see `web/.env.example`)
3. Run migrations: `cd web && npm run migrate`
4. Test publish: `cd web && npm run mqtt:test`
5. Firmware: set `MQTT_BROKER_HOST` in `firmware/include/config.h` to your broker IP, then build/upload



## Security
- Follows OWASP Top 10 practices
- Parameterized queries for all DB operations
- Input validation and sanitization
- API authentication required for data modification
- Secrets via environment variables (not committed)

## Testing
- Firmware: PlatformIO Unity test framework
- Backend: Jest + Supertest

## Documentation
- See `docs/` for wiring diagrams, schematics, and further guides.

## Contributing
Pull requests are welcome! Please add tests for new features and follow the code style guidelines in `.github/copilot-instructions.md`.

## License
[MIT](LICENSE)

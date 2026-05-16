# Smart Lock / Absensi RFID — Project Guidelines

## Project Overview

IoT-based Smart Lock & Attendance system using RFID. An ESP32 reads RFID cards, displays status on OLED, controls a relay (door lock), and sends attendance data via WiFi to a REST API backed by PostgreSQL. A web dashboard and Android app provide management and monitoring.

## Architecture

```
┌─────────────┐       WiFi/HTTP        ┌──────────────────┐       ┌────────────────┐
│   ESP32     │ ───────────────────────►│  REST API        │◄─────►│  PostgreSQL    │
│  + MFRC522  │   POST /attendance      │  (Express.js)    │       │  Database      │
│  + OLED     │◄─────── JSON ──────────►│                  │       └────────────────┘
│  + Relay    │                         └──────────────────┘
└─────────────┘                                 ▲       ▲
                                                │       │
                                    ┌───────────┘       └───────────┐
                                    │                               │
                            ┌───────────────┐             ┌─────────────────┐
                            │ Web Dashboard │             │  Android App    │
                            │ (Frontend)    │             │  (Kotlin)       │
                            └───────────────┘             └─────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Microcontroller | ESP32 DevKit V1 (Arduino framework via PlatformIO) |
| RFID Module | MFRC522 (SPI interface) |
| Display | OLED 0.96" 128x64 SSD1306 (I2C interface) |
| Actuator | 5V Relay Module (simulates solenoid door lock) |
| Backend API | Node.js + Express.js |
| Database | PostgreSQL |
| Web Dashboard | HTML/CSS/JS (or framework TBD) |
| Mobile App | Android (Kotlin) |
| Build System | PlatformIO (firmware), npm (web), Gradle (Android) |

## Folder Structure

```
/
├── firmware/          # ESP32 PlatformIO project
│   ├── src/
│   ├── include/
│   ├── lib/
│   ├── test/
│   └── platformio.ini
├── web/               # Express.js backend + web dashboard
│   ├── src/
│   ├── tests/
│   └── package.json
├── android/           # Android Kotlin app
│   └── app/
├── docs/              # Documentation, schematics
└── .github/           # Copilot instructions, CI/CD
```

## Code Style & Conventions

- Always use type hints in any language that supports them (TypeScript, Kotlin, Python)
- JavaScript/TypeScript must use semicolons
- Follow RESTful API design principles
- Use scripts to perform actions when available (`npm scripts`, `pio run`, `gradle tasks`)
- English for code identifiers and documentation
- Keep functions small and single-purpose

## Security

- Always follow OWASP Top 10 security practices
- Use parameterized queries for all database operations (never string concatenation)
- Validate and sanitize all inputs at system boundaries
- Use environment variables for secrets (DB credentials, API keys) — never commit them
- Implement authentication on all API endpoints that modify data
- Use HTTPS in production

## Testing

- Unit tests are required and must pass before any PR
  - Focus on core functionality (RFID parsing, API logic, data validation)
- End-to-end tests are required
  - Focus on core functionality flows (card tap → API → DB → response)
  - Validate accessibility on web and Android interfaces
- Firmware: use PlatformIO's Unity test framework
- Backend: use Jest or Vitest
- Android: use JUnit + Espresso

## Build & Run Commands

```bash
# Firmware
cd firmware && pio run              # Build
cd firmware && pio run -t upload    # Upload to ESP32
cd firmware && pio test             # Run unit tests

# Backend
cd web && npm install               # Install dependencies
cd web && npm run dev               # Start dev server
cd web && npm test                  # Run tests

# Android
cd android && ./gradlew build       # Build
cd android && ./gradlew test        # Run unit tests
cd android && ./gradlew connectedAndroidTest  # E2E tests
```

## Key Libraries (Firmware)

| Library | Purpose |
|---------|---------|
| MFRC522 | RFID card read/write via SPI |
| Adafruit_SSD1306 | OLED display driver (I2C) |
| Adafruit_GFX | Graphics primitives for OLED |
| WiFi | ESP32 WiFi connectivity |
| HTTPClient | HTTP requests to backend API |
| ArduinoJson | JSON serialization/deserialization |

## Beginner Context

The developer is a beginner in IoT but has programming fundamentals. When explaining hardware-related concepts (SPI, I2C, GPIO, interrupts, voltage levels), provide brief clear explanations. Link to relevant docs when helpful.

## Hardware Photo Validation Protocol

- For any wiring-related response or wiring document update, first review the available hardware photos in `.github/hardware pics`.
- Treat `.github/hardware pics` as the source of truth for physical pin labels and module variants.
- If a component is not present in `.github/hardware pics`, mark it as unverified and do not provide a final ASCII wiring diagram for that component.
- When updating wiring docs, align pin names/order with what is visible in the photos and explicitly call out any missing hardware evidence.

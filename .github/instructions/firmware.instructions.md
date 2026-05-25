---
description: "Use when writing or modifying ESP32 firmware code, PlatformIO configuration, Arduino sketches, or hardware driver code. Covers RFID, OLED, Relay, WiFi, HTTP, and MQTT patterns."
applyTo: "firmware/**"
---
# Firmware Conventions (ESP32 + Arduino Framework)

## PlatformIO

- Use `platformio.ini` for all build configuration
- Declare library dependencies in `lib_deps` (not manual downloads)
- Target board: `esp32dev`
- If `pio` not in PATH: `C:/Users/DELL/.platformio/penv/Scripts/pio.exe run`

## Code Structure

- `src/main.cpp` — entry point; calls `loopMqtt()` at start of every `loop()`
- `include/config.h` — WiFi, API URL, `ACCESS_POINT_ID`, MQTT broker settings
- `include/rfid.h` — MFRC522 read + UID formatting
- `include/display.h` — OLED helpers
- `include/led.h` — status LEDs (GPIO 25 blue granted, GPIO 27 red denied)
- `include/mqtt.h` — PubSubClient connect, telemetry publish, LWT offline
- `include/relay.h` — relay lock/unlock (GPIO 26, active LOW, auto-lock via `loopRelay()`)

## RFID (MFRC522 — SPI)

- Library: `miguelbalboa/MFRC522`
- Always `PICC_IsNewCardPresent()` before read
- `PICC_HaltA()` + `PCD_StopCrypto1()` after each read
- UID as uppercase hex for API

## OLED (SSD1306 — I2C)

- `clearDisplay()` before write; `display()` to flush

## Status LEDs (GPIO)

- `initLeds()` in `setup()` after RFID init — default idle: **red ON**, blue OFF
- `setAccessLeds(granted)` after scan: granted → blue ON, red OFF; denied/error → red ON, blue OFF
- `clearLeds()` / `setIdleLeds()` when returning to idle — red ON again (same 3s window as OLED)
- Active HIGH; 100Ω resistor in series per LED (see `wiring.instructions.md`)

## WiFi & HTTP (card scan)

- `POST /api/scan` with `{ "uid": "...", "access_point_id": ACCESS_POINT_ID }`
- Reconnect WiFi before HTTP if disconnected
- `http.setTimeout(HTTP_TIMEOUT_MS)`
- Fail-safe: deny access on network/parse errors

## MQTT (hardware telemetry)

- Library: `knolleary/PubSubClient`
- Connect after WiFi in `initMqtt()`; maintain in `loopMqtt()`
- Publish topic: `smartlock/ap/<ACCESS_POINT_ID>/telemetry`
- LWT topic: `smartlock/ap/<ACCESS_POINT_ID>/status` with `{"online":false,"status":"offline"}`
- Payload fields: `access_point_id`, `online`, `ip_address`, `mac_address`, `firmware_version`, `signal_dbm`, `core_temp_c` (ESP32 `temperatureRead()`)
- Interval: `MQTT_TELEMETRY_INTERVAL_MS` (default 60s) — must stay under dashboard 120s offline threshold
- **`MQTT_BROKER_HOST`**: LAN IP of machine running Mosquitto — never `localhost`

## Relay Control (GPIO)

- `initRelay()` in `setup()` after `initLeds()` — default **locked** at boot
- `loopRelay()` at start of `loop()` (with `loopMqtt()`) — `millis()` auto-lock after `RELAY_UNLOCK_DURATION_MS`
- `unlockRelay(duration)` on `result.access == true`; `lockRelay()` on denied, server error, and idle return
- GPIO 26, active LOW (`RELAY_ACTIVE_LOW` in `config.h`); **4.7k–10kΩ pull-up IN→5V**; locked = `pinMode(INPUT)`, unlock = `OUTPUT` + LOW
- Fail to locked on any error; never `delay()` for unlock timing

## Error Handling

- Display errors on OLED; Serial for debug
- MQTT disconnect does not block RFID scan path

## Naming Conventions

- Constants: `UPPER_SNAKE_CASE`
- Functions: `camelCase`
- Globals: `g_` prefix in `mqtt.h`

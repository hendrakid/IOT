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
- `include/actuator.h` — lock/unlock facade (`ACTUATOR_TYPE`: relay or SG90 servo)
- `include/relay.h` — relay backend (GPIO 26 DevKit / GPIO 2 C3, active LOW, auto-lock via `loopRelay()`)

## RFID (MFRC522 — SPI)

- Library: `miguelbalboa/MFRC522`
- Always `PICC_IsNewCardPresent()` before read
- `PICC_HaltA()` + `PCD_StopCrypto1()` after each read
- UID as uppercase hex for API

## OLED (SSD1306 — I2C)

- Enabled on ESP32 DevKit V1 only (`DISPLAY_ENABLED=1`). ESP32-C3 uses Serial/LED/buzzer (`DISPLAY_ENABLED=0`) so GPIO8/GPIO9 stay free.
- When enabled: `clearDisplay()` before write; `display()` to flush

## Status LEDs (GPIO)

- `initLeds()` in `setup()` after RFID init — default idle: **red ON**, blue OFF
- `setAccessLeds(granted)` after scan: granted → blue ON, red OFF; denied/error → red ON, blue OFF
- `clearLeds()` / `setIdleLeds()` when returning to idle — red ON again (same 3s window as OLED)
- Active HIGH; 100Ω resistor in series per LED (see `wiring.instructions.md`)

## WiFi & HTTP (card scan)

- `POST /api/scan` with `{ "uid": "...", "access_point_id": ACCESS_POINT_ID }`
- Reconnect WiFi before HTTP if disconnected
- `http.setTimeout(HTTP_TIMEOUT_MS)`
- API failure fallback: check `include/whitelist.h`; grant only listed UIDs and keep unlisted UIDs locked

## MQTT (hardware telemetry)

- Library: `knolleary/PubSubClient`
- Connect after WiFi in `initMqtt()`; maintain in `loopMqtt()`
- Publish topic: `smartlock/ap/<ACCESS_POINT_ID>/telemetry`
- LWT topic: `smartlock/ap/<ACCESS_POINT_ID>/status` with `{"online":false,"status":"offline"}`
- Payload fields: `access_point_id`, `online`, `ip_address`, `mac_address`, `firmware_version`, `signal_dbm`, `core_temp_c` (ESP32 `temperatureRead()`)
- Interval: `MQTT_TELEMETRY_INTERVAL_MS` (default 60s) — must stay under dashboard 120s offline threshold
- **`MQTT_BROKER_HOST`**: LAN IP of machine running Mosquitto — never `localhost`

## Actuator Control (GPIO)

- `initActuator()` in `setup()` after `initLeds()` — default **locked** at boot
- `loopActuator()` at start of `loop()` (with `loopMqtt()`) — `millis()` auto-lock after `ACTUATOR_UNLOCK_DURATION_MS` (alias of `RELAY_UNLOCK_DURATION_MS`)
- `unlockActuator(duration)` on `result.access == true`; `lockActuator()` on denied, server error, and idle return
- Select backend in `config.h`: `ACTUATOR_TYPE` = `ACTUATOR_RELAY` (default) or `ACTUATOR_SERVO`
- Relay: GPIO 26 / C3 GPIO 2, active LOW (`RELAY_ACTIVE_LOW`); **4.7k–10kΩ pull-up IN→5V**; locked = `pinMode(INPUT)`, unlock = `OUTPUT` + LOW
- Servo (C3 POC, SG90): GPIO 2 PWM via ESP32Servo; `SERVO_ANGLE_LOCKED` / `SERVO_ANGLE_UNLOCKED`; **no relay or solenoid**; stay attached after move
- Fail to locked for denied or unlisted UIDs; API errors use the local whitelist fallback. Never use `delay()` for unlock timing

## Error Handling

- Display errors on OLED (DevKit) or Serial `[UI]` lines (ESP32-C3); Serial for debug either way
- MQTT disconnect does not block RFID scan path

## Naming Conventions

- Constants: `UPPER_SNAKE_CASE`
- Functions: `camelCase`
- Globals: `g_` prefix in `mqtt.h`

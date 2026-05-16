---
description: "Use when writing or modifying ESP32 firmware code, PlatformIO configuration, Arduino sketches, or hardware driver code. Covers RFID, OLED, Relay, WiFi, and HTTP patterns."
applyTo: "firmware/**"
---
# Firmware Conventions (ESP32 + Arduino Framework)

## PlatformIO

- Use `platformio.ini` for all build configuration
- Declare library dependencies in `lib_deps` (not manual downloads)
- Use `pio run` to build, `pio test` for unit tests, `pio run -t upload` to flash
- Target board: `esp32dev`

## Code Structure

- `src/main.cpp` — entry point with `setup()` and `loop()`
- Keep `loop()` non-blocking — never use `delay()` for timing in production code; use `millis()` based timing
- Separate concerns into modules: `rfid.h`, `display.h`, `network.h`, `relay.h`
- Use header guards or `#pragma once`

## RFID (MFRC522 — SPI)

- Library: `miguelbalboa/MFRC522`
- Always check `mfrc522.PICC_IsNewCardPresent()` before reading
- Read UID as byte array, convert to hex string for API transmission
- Call `mfrc522.PICC_HaltA()` and `mfrc522.PCD_StopCrypto1()` after each read
- SPI pins are hardware-defined: SCK=18, MOSI=23, MISO=19. Only SS and RST are configurable

## OLED Display (SSD1306 — I2C)

- Library: `adafruit/Adafruit SSD1306` + `adafruit/Adafruit GFX Library`
- I2C address: `0x3C` (default for 128x64)
- Always call `display.clearDisplay()` before writing new content
- Call `display.display()` to push buffer to screen
- Use small text size (`setTextSize(1)`) for status messages, larger for important info

## Relay Control (GPIO)

- Use `digitalWrite()` for on/off control
- Define relay as active LOW or active HIGH based on module type (document in code)
- Implement a timeout: auto-lock after N seconds (use `millis()` timer, not `delay()`)
- Set relay pin to safe state (locked) in `setup()`

## WiFi & HTTP

- Library: built-in `WiFi.h` and `HTTPClient.h`
- Implement reconnection logic — WiFi can drop; check `WiFi.status()` in loop
- Use `ArduinoJson` for JSON serialization/deserialization
- Set HTTP timeout to avoid blocking indefinitely
- Always check HTTP response code before parsing response body
- Send attendance data as POST with JSON body: `{ "card_uid": "...", "timestamp": ... }`

## Error Handling

- Display errors on OLED (network down, card read failed, etc.)
- Use serial output (`Serial.println()`) for debugging — remove or guard with `#ifdef DEBUG` for production
- Never leave relay in unlocked state on error — fail to locked state

## Naming Conventions

- Constants: `UPPER_SNAKE_CASE` (e.g., `RELAY_PIN`, `SPI_SS_PIN`)
- Functions: `camelCase` (e.g., `readRfidCard()`, `sendAttendance()`)
- Global variables: prefix with `g_` or use a namespace

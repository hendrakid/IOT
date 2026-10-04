#pragma once

// ── WiFi credentials ─────────────────────────────────────────────────────────
// Replace with your actual WiFi SSID and password.
// Do NOT commit real credentials — use a local override or environment-injected
// build flags instead.
#ifndef WIFI_SSID
#define WIFI_SSID "Home"
#endif

#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD "Passw0rdH0me"
#endif

// ── Backend API ───────────────────────────────────────────────────────────────
// Base URL of the Express API server (no trailing slash).
// Example: "http://192.168.1.100:3000"
#ifndef API_BASE_URL
#define API_BASE_URL "http://192.168.0.100:3000"
#endif

// POST /api/scan — unified entry point for card taps
#define API_SCAN_ENDPOINT API_BASE_URL "/api/scan"

// ── Timeouts ──────────────────────────────────────────────────────────────────
#define HTTP_TIMEOUT_MS 5000             // HTTP request timeout (ms)
#define WIFI_CONNECT_TIMEOUT_MS 15000    // Max time to wait for WiFi (ms)
#define WIFI_RECONNECT_INTERVAL_MS 10000 // Retry interval when WiFi is down (ms)

// ── Access Point ID ────────────────────────────────────────────────────────────
// Set sesuai ID access point/pintu di backend
#define ACCESS_POINT_ID 1

// ── Firmware version (shown in hardware dashboard via MQTT telemetry) ─────────
#ifndef FIRMWARE_VERSION
#define FIRMWARE_VERSION "1.0.0"
#endif

// ── MQTT broker (telemetry + LWT status) ──────────────────────────────────────
// Host/IP of MQTT broker (same machine as API or dedicated broker)
#ifndef MQTT_BROKER_HOST
#define MQTT_BROKER_HOST "192.168.0.100"
#endif

#ifndef MQTT_BROKER_PORT
#define MQTT_BROKER_PORT 1883
#endif

// Unique client id per device (change if running multiple ESP32 on same broker)
#ifndef MQTT_CLIENT_ID
#define MQTT_CLIENT_ID "smartlock-ap-1"
#endif

// Optional broker credentials (leave empty if broker allows anonymous)
#ifndef MQTT_USERNAME
#define MQTT_USERNAME ""
#endif

#ifndef MQTT_PASSWORD
#define MQTT_PASSWORD ""
#endif

// Fixed power source for this device. Set per firmware build/device.
#define POWER_SOURCE_BATTERY 0
#define POWER_SOURCE_ADAPTER 1
#ifndef POWER_SOURCE
#define POWER_SOURCE POWER_SOURCE_BATTERY
#endif

#if POWER_SOURCE == POWER_SOURCE_ADAPTER
#define POWER_SOURCE_NAME "adapter"
#else
#define POWER_SOURCE_NAME "battery"
#endif

// Publish telemetry every N ms (keep under 2 min for dashboard online threshold)
#define MQTT_TELEMETRY_INTERVAL_MS 60000

// Reconnect attempt interval when MQTT is disconnected
#define MQTT_RECONNECT_INTERVAL_MS 10000

// ── Actuator selection (compile-time) ─────────────────────────────────────────
// ACTUATOR_RELAY: 5V relay + 12V solenoid (default).
// ACTUATOR_SERVO: SG90 door open/close. Do NOT wire relay or solenoid.
// ESP32-C3 servo POC: set ACTUATOR_TYPE to ACTUATOR_SERVO.
#define ACTUATOR_RELAY 0
#define ACTUATOR_SERVO 1
#ifndef ACTUATOR_TYPE
#define ACTUATOR_TYPE ACTUATOR_RELAY
#endif

// ── Relay (5V 1-channel) — used when ACTUATOR_TYPE == ACTUATOR_RELAY ──────────
// Default GPIO 2 on ESP32-C3 Super Mini, GPIO 26 on ESP32 DevKit V1.
#ifndef RELAY_PIN
#if CONFIG_IDF_TARGET_ESP32C3
#define RELAY_PIN 2
#else
#define RELAY_PIN 26
#endif
#endif

// 0 = active HIGH; 1 = active LOW (verified on JQC-3FF module).
// Requires 4.7k–10kΩ pull-up IN→5V (VIN) AND 10kΩ series IN→GPIO26; see wiring.instructions.md.
#ifndef RELAY_ACTIVE_LOW
#define RELAY_ACTIVE_LOW 1
#endif

#ifndef RELAY_UNLOCK_DURATION_MS
#define RELAY_UNLOCK_DURATION_MS 3000
#endif

#ifndef ACTUATOR_UNLOCK_DURATION_MS
#define ACTUATOR_UNLOCK_DURATION_MS RELAY_UNLOCK_DURATION_MS
#endif

// ── Servo (SG90) — used when ACTUATOR_TYPE == ACTUATOR_SERVO ───────────────────
#ifndef SERVO_PIN
#if CONFIG_IDF_TARGET_ESP32C3
#define SERVO_PIN 2
#else
#define SERVO_PIN 26
#endif
#endif

#ifndef SERVO_ANGLE_LOCKED
#define SERVO_ANGLE_LOCKED 0
#endif

#ifndef SERVO_ANGLE_UNLOCKED
#define SERVO_ANGLE_UNLOCKED 180
#endif

// ── Active buzzer feedback ───────────────────────────────────────────────────
#ifndef BUZZER_PIN
#if CONFIG_IDF_TARGET_ESP32C3
#define BUZZER_PIN 21
#else
#define BUZZER_PIN 32
#endif
#endif

#ifndef BUZZER_ACTIVE_HIGH
#define BUZZER_ACTIVE_HIGH 1
#endif

#ifndef BUZZER_BEEP_DURATION_MS
#define BUZZER_BEEP_DURATION_MS 100
#endif

#ifndef BUZZER_BEEP_GAP_MS
#define BUZZER_BEEP_GAP_MS 100
#endif

// ── Touch unlock sensor (TTP223-style digital OUT) ───────────────────────────
#ifndef TOUCH_UNLOCK_PIN
#if CONFIG_IDF_TARGET_ESP32C3
#define TOUCH_UNLOCK_PIN 20
#else
#define TOUCH_UNLOCK_PIN 33
#endif
#endif

#ifndef TOUCH_UNLOCK_ACTIVE_HIGH
#define TOUCH_UNLOCK_ACTIVE_HIGH 1
#endif

#ifndef TOUCH_UNLOCK_DEBOUNCE_MS
#define TOUCH_UNLOCK_DEBOUNCE_MS 50
#endif

#ifndef TOUCH_UNLOCK_COOLDOWN_MS
#define TOUCH_UNLOCK_COOLDOWN_MS 1000
#endif

// ── OLED (SSD1306) ───────────────────────────────────────────────────────────
// DevKit V1: enabled (I2C GPIO21/22). ESP32-C3: disabled — not enough GPIO;
// GPIO8/GPIO9 stay free. Override with -DDISPLAY_ENABLED=1 only if you wire OLED.
#ifndef DISPLAY_ENABLED
#if CONFIG_IDF_TARGET_ESP32C3
#define DISPLAY_ENABLED 0
#else
#define DISPLAY_ENABLED 1
#endif
#endif

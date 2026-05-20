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
#define HTTP_TIMEOUT_MS 5000          // HTTP request timeout (ms)
#define WIFI_CONNECT_TIMEOUT_MS 15000 // Max time to wait for WiFi (ms)
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

// Publish telemetry every N ms (keep under 2 min for dashboard online threshold)
#define MQTT_TELEMETRY_INTERVAL_MS 60000

// Reconnect attempt interval when MQTT is disconnected
#define MQTT_RECONNECT_INTERVAL_MS 10000

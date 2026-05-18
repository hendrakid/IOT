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

// ── Access Point ID ────────────────────────────────────────────────────────────
// Set sesuai ID access point/pintu di backend
#define ACCESS_POINT_ID 1

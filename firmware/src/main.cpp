#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "display.h"
#include "rfid.h"

// How long (ms) to show the result before returning to idle screen
static const uint32_t UID_DISPLAY_DURATION_MS = 3000;

static uint32_t g_uidShownAt = 0;
static bool     g_showingUID = false;

// ── WiFi ─────────────────────────────────────────────────────────────────────

static void connectWiFi() {
    showMessage("Smart Lock", "Connecting WiFi...");
    Serial.print(F("[WiFi] Connecting to "));
    Serial.println(WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    const uint32_t deadline = millis() + WIFI_CONNECT_TIMEOUT_MS;
    while (WiFi.status() != WL_CONNECTED && millis() < deadline) {
        delay(500);
        Serial.print('.');
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.print(F("\n[WiFi] Connected. IP: "));
        Serial.println(WiFi.localIP());
        // Line 1: "Connected!" — Line 2: SSID
        showMessage("Connected!", String(WIFI_SSID));
        delay(1500);
        // Line 1: "IP:" — Line 2: ESP32's IP address
        showMessage("IP:", WiFi.localIP().toString());
        delay(1500);
    } else {
        Serial.println(F("\n[WiFi] Connection FAILED"));
        showMessage("WiFi Error", "Check config.h");
    }
}

// ── HTTP scan ────────────────────────────────────────────────────────────────

struct ScanResult {
    bool   access;
    bool   registered;
    bool   serverError;
    String userName;
};

/**
 * POST {"uid": "<uid>"} to API_SCAN_ENDPOINT.
 * On any network/parse error returns access=false (fail-safe: deny access).
 */
static ScanResult postScan(const String &uid) {
    ScanResult result = { false, false, false, "" };

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println(F("[HTTP] WiFi not connected — reconnecting"));
        connectWiFi();
        if (WiFi.status() != WL_CONNECTED) {
            result.serverError = true;
            return result;
        }
    }

    HTTPClient http;
    http.begin(API_SCAN_ENDPOINT);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(HTTP_TIMEOUT_MS);

    JsonDocument reqDoc;
    reqDoc["uid"] = uid;
    String body;
    serializeJson(reqDoc, body);

    Serial.print(F("[HTTP] POST "));
    Serial.print(API_SCAN_ENDPOINT);
    Serial.print(F(" → "));
    Serial.println(body);

    int httpCode = http.POST(body);

    if (httpCode != 200 && httpCode != 201) {
        Serial.print(F("[HTTP] Error code: "));
        Serial.println(httpCode);
        http.end();
        result.serverError = true;
        return result;
    }

    JsonDocument resDoc;
    DeserializationError err = deserializeJson(resDoc, http.getString());
    http.end();

    if (err) {
        Serial.print(F("[HTTP] JSON parse error: "));
        Serial.println(err.c_str());
        result.serverError = true;
        return result;
    }

    result.access     = resDoc["data"]["access"]     | false;
    result.registered = resDoc["data"]["registered"] | false;
    const char *name  = resDoc["data"]["user_name"];
    if (name) result.userName = String(name);

    Serial.print(F("[HTTP] access="));
    Serial.print(result.access ? F("true") : F("false"));
    Serial.print(F(" registered="));
    Serial.print(result.registered ? F("true") : F("false"));
    Serial.print(F(" user="));
    Serial.println(result.userName);

    return result;
}

// ── Arduino lifecycle ─────────────────────────────────────────────────────────

void setup() {
    Serial.begin(115200);
    Serial.println(F("[BOOT] Smart Lock starting..."));

    if (!initDisplay()) {
        Serial.println(F("[BOOT] OLED init failed. Halting."));
        while (true) { delay(1000); }
    }

    showMessage("Smart Lock", "Initializing...");
    Serial.println(F("[BOOT] OLED OK"));

    initRfid();
    Serial.println(F("[BOOT] RFID OK"));

    connectWiFi();

    showMessage("Smart Lock", "Tap your card...");
    Serial.println(F("[BOOT] Ready."));
}

void loop() {
    const uint32_t now = millis();

    // If result is being shown, wait then return to idle
    if (g_showingUID) {
        if (now - g_uidShownAt >= UID_DISPLAY_DURATION_MS) {
            g_showingUID = false;
            showMessage("Smart Lock", "Tap your card...");
        }
        return;
    }

    // Try to read a card
    String uid = readCardUID();
    if (uid.length() == 0) {
        return;
    }

    Serial.print(F("[RFID] Card UID: "));
    Serial.println(uid);

    showMessage("Checking...", uid);

    ScanResult result = postScan(uid);

    if (result.serverError) {
        Serial.println(F("[RFID] Server error — access denied"));
        showMessage("Server Error", "Cek IP / koneksi");
    } else {
        Serial.print(F("[RFID] Access: "));
        Serial.println(result.access ? F("GRANTED") : F("DENIED"));
        showScanResult(result.access, result.registered, result.userName, uid);
    }
    g_showingUID = true;
    g_uidShownAt = millis(); // ambil setelah postScan() selesai, bukan sebelumnya
}

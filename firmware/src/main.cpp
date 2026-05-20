#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "display.h"
#include "rfid.h"
#include "mqtt.h"
#include "led.h"

// How long (ms) to show the result before returning to idle screen
static const uint32_t UID_DISPLAY_DURATION_MS = 3000;

static uint32_t g_uidShownAt = 0;
static bool g_showingUID = false;

// ── WiFi ─────────────────────────────────────────────────────────────────────

static uint32_t g_lastWifiReconnectMs = 0;
static bool g_wifiWasConnected = false;

/** Attempt STA connect; returns true when WL_CONNECTED. */
static bool connectWiFi(bool showSuccessScreens = true)
{
    if (showSuccessScreens)
        showMessage("Smart Lock", "Connecting WiFi...");
    else
        showMessage("Smart Lock", "Reconnecting...");

    Serial.print(F("[WiFi] Connecting to "));
    Serial.println(WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.disconnect(true);
    delay(100);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    const uint32_t deadline = millis() + WIFI_CONNECT_TIMEOUT_MS;
    while (WiFi.status() != WL_CONNECTED && millis() < deadline)
    {
        delay(500);
        Serial.print('.');
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.print(F("\n[WiFi] Connected. IP: "));
        Serial.println(WiFi.localIP());
        g_wifiWasConnected = true;
        if (showSuccessScreens)
        {
            showMessage("Connected!", String(WIFI_SSID));
            delay(1500);
            showMessage("IP:", WiFi.localIP().toString());
            delay(1500);
        }
        return true;
    }

    Serial.println(F("\n[WiFi] Connection FAILED"));
    g_wifiWasConnected = false;
    if (showSuccessScreens)
        showMessage("WiFi Error", "Check config.h");
    else
        showMessage("WiFi Error", "Retrying...");
    return false;
}

/** Periodic reconnect when link drops; does not block card-result display. */
static void loopWiFi()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        if (!g_wifiWasConnected)
        {
            g_wifiWasConnected = true;
            Serial.println(F("[WiFi] Link restored"));
            initMqtt();
            if (!g_showingUID)
                showMessage("Smart Lock", "Tap your card...");
        }
        return;
    }

    g_wifiWasConnected = false;

    const uint32_t now = millis();
    if (now - g_lastWifiReconnectMs < WIFI_RECONNECT_INTERVAL_MS)
        return;

    g_lastWifiReconnectMs = now;

    if (g_showingUID)
        return;

    Serial.println(F("[WiFi] Disconnected — retrying"));
    if (connectWiFi(false))
    {
        initMqtt();
        showMessage("Smart Lock", "Tap your card...");
    }
}

// ── HTTP scan ────────────────────────────────────────────────────────────────

struct ScanResult
{
    bool access;
    bool registered;
    bool serverError;
    String userName;
};

/**
 * POST {"uid": "<uid>"} to API_SCAN_ENDPOINT.
 * On any network/parse error returns access=false (fail-safe: deny access).
 */
static ScanResult postScan(const String &uid)
{
    ScanResult result = {false, false, false, ""};

    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println(F("[HTTP] WiFi not connected — reconnecting"));
        connectWiFi();
        if (WiFi.status() != WL_CONNECTED)
        {
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
    reqDoc["access_point_id"] = ACCESS_POINT_ID;
    String body;
    serializeJson(reqDoc, body);

    Serial.print(F("[HTTP] POST "));
    Serial.print(API_SCAN_ENDPOINT);
    Serial.print(F(" → "));
    Serial.println(body);

    int httpCode = http.POST(body);

    if (httpCode != 200 && httpCode != 201)
    {
        Serial.print(F("[HTTP] Error code: "));
        Serial.println(httpCode);
        http.end();
        result.serverError = true;
        return result;
    }

    JsonDocument resDoc;
    DeserializationError err = deserializeJson(resDoc, http.getString());
    http.end();

    if (err)
    {
        Serial.print(F("[HTTP] JSON parse error: "));
        Serial.println(err.c_str());
        result.serverError = true;
        return result;
    }

    result.access = resDoc["data"]["access"] | false;
    result.registered = resDoc["data"]["registered"] | false;
    const char *name = resDoc["data"]["user_name"];
    if (name)
        result.userName = String(name);

    Serial.print(F("[HTTP] access="));
    Serial.print(result.access ? F("true") : F("false"));
    Serial.print(F(" registered="));
    Serial.print(result.registered ? F("true") : F("false"));
    Serial.print(F(" user="));
    Serial.println(result.userName);

    return result;
}

// ── Arduino lifecycle ─────────────────────────────────────────────────────────

void setup()
{
    Serial.begin(115200);
    Serial.println(F("[BOOT] Smart Lock starting..."));

    if (!initDisplay())
    {
        Serial.println(F("[BOOT] OLED init failed. Halting."));
        while (true)
        {
            delay(1000);
        }
    }

    showMessage("Smart Lock", "Initializing...");
    Serial.println(F("[BOOT] OLED OK"));

    initRfid();
    Serial.println(F("[BOOT] RFID OK"));

    initLeds();

    connectWiFi();
    initMqtt();

    showMessage("Smart Lock", "Tap your card...");
    Serial.println(F("[BOOT] Ready."));
}

void loop()
{
    loopWiFi();
    loopMqtt();

    const uint32_t now = millis();

    // If result is being shown, wait then return to idle
    if (g_showingUID)
    {
        if (now - g_uidShownAt >= UID_DISPLAY_DURATION_MS)
        {
            g_showingUID = false;
            clearLeds();
            showMessage("Smart Lock", "Tap your card...");
        }
        return;
    }

    // Try to read a card
    String uid = readCardUID();
    if (uid.length() == 0)
    {
        return;
    }

    Serial.print(F("[RFID] Card UID: "));
    Serial.println(uid);

    showMessage("Checking...", uid);

    ScanResult result = postScan(uid);

    if (result.serverError)
    {
        Serial.println(F("[RFID] Server error — access denied"));
        setAccessLeds(false);
        showMessage("Server Error", "Cek IP / koneksi");
    }
    else
    {
        Serial.print(F("[RFID] Access: "));
        Serial.println(result.access ? F("GRANTED") : F("DENIED"));
        setAccessLeds(result.access);
        showScanResult(result.access, result.registered, result.userName, uid);
    }
    g_showingUID = true;
    g_uidShownAt = millis(); // ambil setelah postScan() selesai, bukan sebelumnya
}

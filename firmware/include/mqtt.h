#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"

static WiFiClient g_wifiClient;
static PubSubClient g_mqttClient(g_wifiClient);

static char g_telemetryTopic[48];
static char g_statusTopic[48];
static uint32_t g_lastTelemetryMs = 0;
static uint32_t g_lastMqttReconnectMs = 0;

static String formatMacAddress()
{
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char buf[18];
    snprintf(buf, sizeof(buf), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    return String(buf);
}

static void buildMqttTopics()
{
    snprintf(g_telemetryTopic, sizeof(g_telemetryTopic),
             "smartlock/ap/%d/telemetry", ACCESS_POINT_ID);
    snprintf(g_statusTopic, sizeof(g_statusTopic),
             "smartlock/ap/%d/status", ACCESS_POINT_ID);
}

static bool publishTelemetry()
{
    if (!g_mqttClient.connected())
        return false;

    JsonDocument doc;
    doc["access_point_id"] = ACCESS_POINT_ID;
    doc["online"] = true;
    doc["status"] = "online";
    doc["ip_address"] = WiFi.localIP().toString();
    doc["mac_address"] = formatMacAddress();
    doc["firmware_version"] = FIRMWARE_VERSION;
    doc["signal_dbm"] = WiFi.RSSI();
#ifdef ESP32
    doc["core_temp_c"] = static_cast<float>(temperatureRead());
#endif

    String payload;
    serializeJson(doc, payload);

    const bool ok = g_mqttClient.publish(g_telemetryTopic, payload.c_str());
    if (ok)
    {
        Serial.print(F("[MQTT] Published telemetry → "));
        Serial.println(g_telemetryTopic);
    }
    else
    {
        Serial.println(F("[MQTT] Publish telemetry failed"));
    }
    return ok;
}

static bool connectMqtt()
{
    if (WiFi.status() != WL_CONNECTED)
        return false;

    buildMqttTopics();
    g_mqttClient.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);

    // LWT: broker publishes offline status if device disconnects unexpectedly
    JsonDocument lwtDoc;
    lwtDoc["access_point_id"] = ACCESS_POINT_ID;
    lwtDoc["online"] = false;
    lwtDoc["status"] = "offline";
    static char lwtBuf[96];
    serializeJson(lwtDoc, lwtBuf, sizeof(lwtBuf));

    Serial.print(F("[MQTT] Connecting to "));
    Serial.print(MQTT_BROKER_HOST);
    Serial.print(':');
    Serial.println(MQTT_BROKER_PORT);

    const bool hasAuth = strlen(MQTT_USERNAME) > 0;
    bool connected = false;

    if (hasAuth)
    {
        connected = g_mqttClient.connect(
            MQTT_CLIENT_ID,
            MQTT_USERNAME,
            MQTT_PASSWORD,
            g_statusTopic,
            0,
            false,
            lwtBuf);
    }
    else
    {
        connected = g_mqttClient.connect(
            MQTT_CLIENT_ID,
            g_statusTopic,
            0,
            false,
            lwtBuf);
    }

    if (connected)
    {
        Serial.println(F("[MQTT] Connected"));
        publishTelemetry();
        g_lastTelemetryMs = millis();
        return true;
    }

    Serial.print(F("[MQTT] Connect failed, state="));
    Serial.println(g_mqttClient.state());
    return false;
}

void initMqtt()
{
    buildMqttTopics();
    g_mqttClient.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
    g_mqttClient.setBufferSize(512);
    g_lastMqttReconnectMs = 0;
    g_lastTelemetryMs = 0;

    if (WiFi.status() == WL_CONNECTED)
        connectMqtt();
}

/** Call from loop() — maintains connection and periodic telemetry. */
void loopMqtt()
{
    if (WiFi.status() != WL_CONNECTED)
        return;

    g_mqttClient.loop();

    const uint32_t now = millis();

    if (!g_mqttClient.connected())
    {
        if (now - g_lastMqttReconnectMs < MQTT_RECONNECT_INTERVAL_MS)
            return;
        g_lastMqttReconnectMs = now;
        connectMqtt();
        return;
    }

    if (now - g_lastTelemetryMs >= MQTT_TELEMETRY_INTERVAL_MS)
    {
        publishTelemetry();
        g_lastTelemetryMs = now;
    }
}

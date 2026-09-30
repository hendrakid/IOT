#pragma once

#include <MFRC522.h>
#include <SPI.h>

// MFRC522 pin assignment
// ESP32-C3 Super Mini: SDA(SS)→GPIO7 | SCK→GPIO4 | MOSI→GPIO6 | MISO→GPIO5 | RST→GPIO10
// ESP32 DevKit V1:     SDA(SS)→GPIO5 | SCK→GPIO18 | MOSI→GPIO23 | MISO→GPIO19 | RST→GPIO4
#if CONFIG_IDF_TARGET_ESP32C3
static const uint8_t SPI_SS_PIN = 7;
static const uint8_t RST_PIN = 10;
#else
static const uint8_t SPI_SS_PIN = 5;
static const uint8_t RST_PIN = 4;
#endif

static MFRC522 mfrc522(SPI_SS_PIN, RST_PIN);

static const uint32_t RFID_HEALTH_CHECK_INTERVAL_MS = 30000;
static const uint8_t RFID_FAILURES_BEFORE_RECOVERY = 2;

static uint32_t g_lastRfidHealthCheckMs = 0;
static uint8_t g_rfidCommunicationFailures = 0;

static bool isRfidVersionValid(uint8_t version)
{
    return version != 0x00 && version != 0xFF;
}

static void resetRfidCommunicationFailureCount()
{
    g_rfidCommunicationFailures = 0;
}

static void recordRfidCommunicationFailure()
{
    if (g_rfidCommunicationFailures < RFID_FAILURES_BEFORE_RECOVERY)
        g_rfidCommunicationFailures++;
}

static bool reinitializeRfid()
{
    Serial.println(F("[RFID] SPI communication failed - reinitializing reader"));

    SPI.end();
    SPI.begin();
    mfrc522.PCD_Init();

    const uint8_t version = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
    const bool healthy = isRfidVersionValid(version);
    Serial.print(F("[RFID] Reinitialize result, firmware version: 0x"));
    Serial.println(version, HEX);

    g_lastRfidHealthCheckMs = millis();
    resetRfidCommunicationFailureCount();
    return healthy;
}

void initRfid()
{
    SPI.begin();
    mfrc522.PCD_Init();
    const uint8_t version = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
    Serial.print(F("[RFID] Firmware version: 0x"));
    Serial.println(version, HEX);
    g_lastRfidHealthCheckMs = millis();
    resetRfidCommunicationFailureCount();
}

// Periodically verifies the MFRC522 SPI path without interrupting normal scans.
void loopRfid()
{
    const uint32_t now = millis();
    if (now - g_lastRfidHealthCheckMs < RFID_HEALTH_CHECK_INTERVAL_MS)
        return;

    g_lastRfidHealthCheckMs = now;
    const uint8_t version = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
    if (isRfidVersionValid(version))
    {
        resetRfidCommunicationFailureCount();
        return;
    }

    Serial.print(F("[RFID] Invalid firmware version during health check: 0x"));
    Serial.println(version, HEX);
    recordRfidCommunicationFailure();
    if (g_rfidCommunicationFailures >= RFID_FAILURES_BEFORE_RECOVERY)
        reinitializeRfid();
}

// Returns hex UID string (e.g. "A3 4F 2B 11") if a card is present,
// otherwise returns an empty string.
String readCardUID()
{
    if (!mfrc522.PICC_IsNewCardPresent())
    {
        return "";
    }
    if (!mfrc522.PICC_ReadCardSerial())
    {
        mfrc522.PICC_HaltA();
        mfrc522.PCD_StopCrypto1();
        recordRfidCommunicationFailure();
        if (g_rfidCommunicationFailures >= RFID_FAILURES_BEFORE_RECOVERY)
            reinitializeRfid();
        return "";
    }

    String uid = "";
    for (uint8_t i = 0; i < mfrc522.uid.size; i++)
    {
        if (i > 0)
            uid += " ";
        if (mfrc522.uid.uidByte[i] < 0x10)
            uid += "0";
        uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    resetRfidCommunicationFailureCount();

    return uid;
}

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

void initRfid()
{
    SPI.begin();
    mfrc522.PCD_Init();
    Serial.print(F("[RFID] Firmware version: 0x"));
    Serial.println(mfrc522.PCD_ReadRegister(MFRC522::VersionReg), HEX);
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

    return uid;
}

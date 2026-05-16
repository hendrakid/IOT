#pragma once

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>

// OLED hardware config — SSD1306 0.96" 128x64
// Pins: GND | VDD→3.3V | SCK→GPIO22 | SDA→GPIO21
static const uint8_t SCREEN_WIDTH  = 128;
static const uint8_t SCREEN_HEIGHT = 64;
static const int8_t  OLED_RESET    = -1;     // shared with ESP32 reset
static const uint8_t OLED_I2C_ADDR = 0x3C;  // default for SSD1306

static Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

bool initDisplay() {
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR)) {
        Serial.println(F("[OLED] ERROR: begin() failed. Check wiring/I2C address."));
        return false;
    }
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.cp437(true);
    return true;
}

void showMessage(const String &line1, const String &line2 = "") {
    display.clearDisplay();

    display.setTextSize(1);
    display.setCursor(0, 10);
    display.println(line1);

    if (line2.length() > 0) {
        display.setTextSize(1);
        display.setCursor(0, 30);
        display.println(line2);
    }

    display.display();
}

void showUID(const String &uid) {
    display.clearDisplay();

    display.setTextSize(1);
    display.setCursor(0, 8);
    display.println(F("Card Detected!"));

    display.drawFastHLine(0, 20, SCREEN_WIDTH, SSD1306_WHITE);

    display.setTextSize(1);
    display.setCursor(0, 28);
    display.println(F("UID:"));
    display.setTextSize(2);
    display.setCursor(0, 42);
    display.println(uid);

    display.display();
}

void showAccessResult(bool granted, const String &uid) {
    display.clearDisplay();

    display.setTextSize(1);
    display.setCursor(0, 8);
    display.println(F("Card Detected"));

    display.drawFastHLine(0, 20, SCREEN_WIDTH, SSD1306_WHITE);

    display.setTextSize(1);
    display.setCursor(0, 28);
    display.println(granted ? F("Access Granted") : F("Access Denied"));

    display.setTextSize(1);
    display.setCursor(0, 44);
    display.println(uid);

    display.display();
}

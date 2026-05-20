#pragma once

#include <Arduino.h>

// Status LEDs — 5mm through-hole, active HIGH
// Default idle: red ON (locked/denied). Granted: blue ON, red OFF.
// GPIO25/27 keep GPIO26 free for relay (planned)
static const uint8_t LED_BLUE_PIN = 25;
static const uint8_t LED_RED_PIN  = 27;

inline void setIdleLeds()
{
    digitalWrite(LED_BLUE_PIN, LOW);
    digitalWrite(LED_RED_PIN, HIGH);
}

inline void initLeds()
{
    pinMode(LED_BLUE_PIN, OUTPUT);
    pinMode(LED_RED_PIN, OUTPUT);
    setIdleLeds();
    Serial.println(F("[LED] Init OK (idle: red)"));
}

// Return to default idle state after scan display timeout
inline void clearLeds()
{
    setIdleLeds();
}

inline void setAccessLeds(bool granted)
{
    if (granted)
    {
        digitalWrite(LED_BLUE_PIN, HIGH);
        digitalWrite(LED_RED_PIN, LOW);
        Serial.println(F("[LED] GRANTED (blue)"));
    }
    else
    {
        digitalWrite(LED_BLUE_PIN, LOW);
        digitalWrite(LED_RED_PIN, HIGH);
        Serial.println(F("[LED] DENIED (red)"));
    }
}

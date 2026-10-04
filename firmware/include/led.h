#pragma once

#include <Arduino.h>
#include "config.h"

// Status LEDs — 5mm through-hole, active HIGH.
// The former red LED GPIO is now used by the blue tap indicator.
// The former blue LED GPIO is now used by the green granted indicator.
// ESP32-C3 Super Mini: GPIO1/GPIO3. ESP32 DevKit V1: GPIO25/27 (keeps GPIO26 free for relay)
#if CONFIG_IDF_TARGET_ESP32C3
static const uint8_t LED_GREEN_PIN = 1;
static const uint8_t LED_TAP_BLUE_PIN = 3;
#else
static const uint8_t LED_GREEN_PIN = 25;
static const uint8_t LED_TAP_BLUE_PIN = 27;
#endif

inline void setIdleLeds()
{
    digitalWrite(LED_GREEN_PIN, LOW);
#if ACTUATOR_TYPE != ACTUATOR_SERVO
    digitalWrite(LED_TAP_BLUE_PIN, LOW);
#endif
}

inline void initLeds()
{
    pinMode(LED_GREEN_PIN, OUTPUT);
#if ACTUATOR_TYPE != ACTUATOR_SERVO
    pinMode(LED_TAP_BLUE_PIN, OUTPUT);
#endif
    setIdleLeds();
    Serial.println(F("[LED] Init OK (idle: all off)"));
}

// Return to default idle state after scan display timeout
inline void clearLeds()
{
    setIdleLeds();
}

inline void setTapLed(bool active)
{
#if ACTUATOR_TYPE == ACTUATOR_SERVO
    (void)active;
    Serial.println(F("[LED] TAP indicator disabled; blue GPIO is reed input"));
#else
    digitalWrite(LED_TAP_BLUE_PIN, active ? HIGH : LOW);
    Serial.println(active ? F("[LED] TAP (blue) ON") : F("[LED] TAP (blue) OFF"));
#endif
}

inline void setAccessLeds(bool granted)
{
    setTapLed(false);
    digitalWrite(LED_GREEN_PIN, granted ? HIGH : LOW);
    if (granted)
    {
        Serial.println(F("[LED] GRANTED (green)"));
    }
    else
    {
        Serial.println(F("[LED] DENIED (all off)"));
    }
}

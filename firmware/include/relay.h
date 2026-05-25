#pragma once

#include <Arduino.h>
#include "config.h"

#if defined(ARDUINO_ARCH_ESP32)
#include "driver/gpio.h"
#if CONFIG_IDF_TARGET_ESP32
#include "driver/dac.h"
#endif
#endif

// 5V active-LOW relay (IN→GND = on, IN→5V = off).
//
// Hardware (required):
//   4.7k–10kΩ: relay IN → 5V (VIN) — pull-up
//   10kΩ:       relay IN → GPIO 26 — series (GPIO must NOT tie directly to 5V node)
//   VCC → 5V, GND common
//
// Direct D26→IN with 5V pull-up clamps IN to ~3.3V via ESP32 protection → SW stays on.
// Locked: GPIO high-Z (INPUT, pulls disabled). Unlock: OUTPUT LOW pulls IN via 10k series.
#ifndef RELAY_PIN
#define RELAY_PIN 26
#endif

static uint32_t g_relayUnlockUntil = 0;
static bool g_relayIsUnlocked = false;

#if defined(ARDUINO_ARCH_ESP32)
static void relayConfigureLockedPin()
{
#if CONFIG_IDF_TARGET_ESP32 && (RELAY_PIN == 25 || RELAY_PIN == 26)
    dac_output_disable(RELAY_PIN == 25 ? DAC_CHANNEL_1 : DAC_CHANNEL_2);
#endif
    gpio_reset_pin((gpio_num_t)RELAY_PIN);
    gpio_set_direction((gpio_num_t)RELAY_PIN, GPIO_MODE_INPUT);
    gpio_pullup_dis((gpio_num_t)RELAY_PIN);
    gpio_pulldown_dis((gpio_num_t)RELAY_PIN);
}

static void relayConfigureUnlockedPin()
{
#if CONFIG_IDF_TARGET_ESP32 && (RELAY_PIN == 25 || RELAY_PIN == 26)
    dac_output_disable(RELAY_PIN == 25 ? DAC_CHANNEL_1 : DAC_CHANNEL_2);
#endif
    gpio_reset_pin((gpio_num_t)RELAY_PIN);
    gpio_set_direction((gpio_num_t)RELAY_PIN, GPIO_MODE_OUTPUT);
#if RELAY_ACTIVE_LOW
    gpio_set_level((gpio_num_t)RELAY_PIN, 0);
#else
    gpio_set_level((gpio_num_t)RELAY_PIN, 1);
#endif
}
#endif

inline void lockRelay()
{
#if RELAY_ACTIVE_LOW
#if defined(ARDUINO_ARCH_ESP32)
    relayConfigureLockedPin();
#else
    pinMode(RELAY_PIN, INPUT);
#endif
#else
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, LOW);
#endif
    g_relayIsUnlocked = false;
    g_relayUnlockUntil = 0;
}

inline void unlockRelay(uint32_t durationMs)
{
#if defined(ARDUINO_ARCH_ESP32)
    relayConfigureUnlockedPin();
#else
    pinMode(RELAY_PIN, OUTPUT);
#if RELAY_ACTIVE_LOW
    digitalWrite(RELAY_PIN, LOW);
#else
    digitalWrite(RELAY_PIN, HIGH);
#endif
#endif
    g_relayIsUnlocked = true;
    g_relayUnlockUntil = millis() + durationMs;
    Serial.print(F("[RELAY] UNLOCK for "));
    Serial.print(durationMs);
    Serial.println(F(" ms"));
}

inline void initRelay()
{
    lockRelay();
    Serial.print(F("[RELAY] Init OK (locked). GPIO26 read="));
    Serial.print(digitalRead(RELAY_PIN));
    Serial.println(F(" — need 10k series IN↔D26 if SW stays on"));
}

/** Call every loop() — auto-lock when unlock duration expires. */
inline void loopRelay()
{
    if (!g_relayIsUnlocked)
        return;

    if (millis() >= g_relayUnlockUntil)
    {
        lockRelay();
        Serial.println(F("[RELAY] Auto-lock"));
    }
}

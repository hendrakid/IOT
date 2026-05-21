#pragma once

#include <Arduino.h>
#include "config.h"

// 5V 1-channel relay — energize to unlock (NO+COM for 12V solenoid)
// Active LOW on IN (verified: IN→GND = SW on, IN→5V = SW off).
//
// ESP32 GPIO is 3.3V; this 5V module needs IN ≈ 5V to turn OFF. Required hardware:
//   4.7k–10kΩ from relay IN to 5V (VIN), plus GPIO 26 (D26) to IN.
//
// Firmware uses open-drain on GPIO 26:
//   Locked:  digitalWrite HIGH → pin floats → pull-up holds IN at 5V → coil off
//   Unlock:  digitalWrite LOW  → IN pulled to GND → coil on
#ifndef RELAY_PIN
#define RELAY_PIN 26
#endif

static uint32_t g_relayUnlockUntil = 0;
static bool g_relayIsUnlocked = false;

inline void writeRelayCoil(bool energized)
{
#if RELAY_ACTIVE_LOW
    digitalWrite(RELAY_PIN, energized ? LOW : HIGH);
#else
    digitalWrite(RELAY_PIN, energized ? HIGH : LOW);
#endif
}

inline void lockRelay()
{
    writeRelayCoil(false);
    g_relayIsUnlocked = false;
    g_relayUnlockUntil = 0;
}

inline void unlockRelay(uint32_t durationMs)
{
    writeRelayCoil(true);
    g_relayIsUnlocked = true;
    g_relayUnlockUntil = millis() + durationMs;
    Serial.print(F("[RELAY] UNLOCK for "));
    Serial.print(durationMs);
    Serial.println(F(" ms"));
}

inline void initRelay()
{
    pinMode(RELAY_PIN, OUTPUT_OPEN_DRAIN);
    lockRelay();
    Serial.println(F("[RELAY] Init OK (locked, open-drain + 5V pull-up on IN)"));
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

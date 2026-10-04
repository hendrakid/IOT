#pragma once

#include <Arduino.h>
#include "config.h"

#ifndef ACTUATOR_RELAY
#define ACTUATOR_RELAY 0
#endif
#ifndef ACTUATOR_SERVO
#define ACTUATOR_SERVO 1
#endif
#ifndef ACTUATOR_TYPE
#define ACTUATOR_TYPE ACTUATOR_RELAY
#endif

#ifndef ACTUATOR_UNLOCK_DURATION_MS
#define ACTUATOR_UNLOCK_DURATION_MS RELAY_UNLOCK_DURATION_MS
#endif

#if ACTUATOR_TYPE == ACTUATOR_SERVO

#include <ESP32Servo.h>

#ifndef SERVO_PIN
#if CONFIG_IDF_TARGET_ESP32C3
#define SERVO_PIN 2
#else
#define SERVO_PIN 26
#endif
#endif

#ifndef SERVO_ANGLE_LOCKED
#define SERVO_ANGLE_LOCKED 0
#endif

#ifndef SERVO_ANGLE_UNLOCKED
#define SERVO_ANGLE_UNLOCKED 90
#endif

static Servo g_servo;
static bool g_actuatorIsUnlocked = false;

inline void lockActuator()
{
    g_servo.write(SERVO_ANGLE_LOCKED);
    g_actuatorIsUnlocked = false;
    Serial.print(F("[SERVO] LOCK angle="));
    Serial.println(SERVO_ANGLE_LOCKED);
}

inline void unlockActuator(uint32_t durationMs)
{
    (void)durationMs;
    g_servo.write(SERVO_ANGLE_UNLOCKED);
    g_actuatorIsUnlocked = true;
    Serial.print(F("[SERVO] UNLOCK angle="));
    Serial.print(SERVO_ANGLE_UNLOCKED);
    Serial.println(F(" until reed switch reports door closed"));
}

inline bool isActuatorUnlocked()
{
    return g_actuatorIsUnlocked;
}

inline void initActuator()
{
    g_servo.attach(SERVO_PIN);
    g_servo.write(SERVO_ANGLE_LOCKED);
    g_actuatorIsUnlocked = false;
    Serial.print(F("[SERVO] Init OK (locked). Pin=GPIO"));
    Serial.print(SERVO_PIN);
    Serial.print(F(" locked="));
    Serial.print(SERVO_ANGLE_LOCKED);
    Serial.print(F(" unlocked="));
    Serial.println(SERVO_ANGLE_UNLOCKED);
}

/** Servo closing is triggered by the reed switch, not by a timer. */
inline void loopActuator() {}

#else

#include "relay.h"

inline void initActuator()
{
    initRelay();
}

inline void lockActuator()
{
    lockRelay();
}

inline void unlockActuator(uint32_t durationMs)
{
    unlockRelay(durationMs);
}

inline void loopActuator()
{
    loopRelay();
}

#endif

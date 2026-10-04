#pragma once

#include <Arduino.h>
#include "config.h"
#include "actuator.h"

static bool g_reedStableClosed = false;
static bool g_reedCandidateClosed = false;
static uint32_t g_reedCandidateSince = 0;
static bool g_reedMonitorActive = false;
static bool g_reedActuatorWasUnlocked = false;
static bool g_reedDoorWasOpened = false;
static uint32_t g_reedCloseDeadline = 0;

inline bool readReedClosed()
{
  const int level = digitalRead(REED_SWITCH_PIN);
#if REED_SWITCH_ACTIVE_LOW
  return level == LOW;
#else
  return level == HIGH;
#endif
}

inline void initReedSwitch()
{
  pinMode(REED_SWITCH_PIN, INPUT_PULLUP);
  g_reedStableClosed = readReedClosed();
  g_reedCandidateClosed = g_reedStableClosed;
  g_reedCandidateSince = millis();

  Serial.print(F("[REED] Init OK. Pin=GPIO"));
  Serial.print(REED_SWITCH_PIN);
  Serial.print(F(" closed="));
  Serial.println(g_reedStableClosed ? F("YES") : F("NO"));
}

inline void armReedCloseMonitor()
{
  const uint32_t now = millis();
  g_reedMonitorActive = true;
  g_reedActuatorWasUnlocked = true;
  g_reedDoorWasOpened = !g_reedStableClosed;
  g_reedCloseDeadline = g_reedStableClosed
                            ? now + SERVO_REED_CLOSE_TIMEOUT_MS
                            : 0;

  Serial.println(g_reedStableClosed
                     ? F("[REED] Door closed; close timeout started")
                     : F("[REED] Door already open; waiting for close"));
}

/** Return true once when the debounced state changes to door closed. */
inline bool updateReedState()
{
  const bool currentClosed = readReedClosed();
  const uint32_t now = millis();

  if (currentClosed != g_reedCandidateClosed)
  {
    g_reedCandidateClosed = currentClosed;
    g_reedCandidateSince = now;
    return false;
  }

  if (g_reedCandidateClosed == g_reedStableClosed ||
      now - g_reedCandidateSince < REED_SWITCH_DEBOUNCE_MS)
  {
    return false;
  }

  g_reedStableClosed = g_reedCandidateClosed;
  Serial.print(F("[REED] Door "));
  Serial.println(g_reedStableClosed ? F("closed") : F("open"));
  return true;
}

/**
 * Return true once when the servo should lock because the door is closed.
 * A closed door uses a timeout; an opened door cancels that timeout and waits
 * for a debounced closed transition.
 */
inline bool consumeReedCloseRequest()
{
  const bool stateChanged = updateReedState();
  const uint32_t now = millis();
  const bool actuatorUnlocked = isActuatorUnlocked();

  if (!actuatorUnlocked)
  {
    g_reedMonitorActive = false;
    g_reedActuatorWasUnlocked = false;
    g_reedDoorWasOpened = false;
    g_reedCloseDeadline = 0;
    return false;
  }

  if (!g_reedActuatorWasUnlocked)
  {
    armReedCloseMonitor();
  }

  if (g_reedStableClosed == false)
  {
    g_reedDoorWasOpened = true;
    g_reedCloseDeadline = 0;
    return false;
  }

  if (g_reedDoorWasOpened && stateChanged)
  {
    g_reedMonitorActive = false;
    return true;
  }

  if (g_reedMonitorActive && !g_reedDoorWasOpened &&
      static_cast<int32_t>(now - g_reedCloseDeadline) >= 0)
  {
    g_reedMonitorActive = false;
    Serial.println(F("[REED] Door stayed closed; close timeout reached"));
    return true;
  }

  return false;
}
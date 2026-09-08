#pragma once

#include <Arduino.h>
#include "config.h"

static bool g_touchLastRawPressed = false;
static bool g_touchStablePressed = false;
static uint32_t g_touchLastChangedAt = 0;
static uint32_t g_touchLastTriggeredAt = 0;

inline bool readTouchUnlockPressed()
{
  const int raw = digitalRead(TOUCH_UNLOCK_PIN);
#if TOUCH_UNLOCK_ACTIVE_HIGH
  return raw == HIGH;
#else
  return raw == LOW;
#endif
}

inline void initTouchUnlock()
{
  pinMode(TOUCH_UNLOCK_PIN, INPUT);
  g_touchLastRawPressed = readTouchUnlockPressed();
  g_touchStablePressed = g_touchLastRawPressed;
  g_touchLastChangedAt = millis();
  g_touchLastTriggeredAt = 0;
  Serial.print(F("[TOUCH] Init OK. GPIO"));
  Serial.println(TOUCH_UNLOCK_PIN);
}

inline bool consumeTouchUnlockPressed()
{
  const uint32_t now = millis();
  const bool rawPressed = readTouchUnlockPressed();

  if (rawPressed != g_touchLastRawPressed)
  {
    g_touchLastRawPressed = rawPressed;
    g_touchLastChangedAt = now;
  }

  if (now - g_touchLastChangedAt < TOUCH_UNLOCK_DEBOUNCE_MS)
    return false;

  if (rawPressed == g_touchStablePressed)
    return false;

  g_touchStablePressed = rawPressed;
  if (!g_touchStablePressed)
    return false;

  if (g_touchLastTriggeredAt != 0 && now - g_touchLastTriggeredAt < TOUCH_UNLOCK_COOLDOWN_MS)
    return false;

  g_touchLastTriggeredAt = now;
  return true;
}
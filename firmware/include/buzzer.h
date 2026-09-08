#pragma once

#include <Arduino.h>
#include "config.h"

static uint8_t g_buzzerRemainingBeeps = 0;
static uint32_t g_buzzerNextToggleMs = 0;
static bool g_buzzerActive = false;
static bool g_buzzerOn = false;

inline void setBuzzerOutput(bool on)
{
#if BUZZER_ACTIVE_HIGH
  digitalWrite(BUZZER_PIN, on ? HIGH : LOW);
#else
  digitalWrite(BUZZER_PIN, on ? LOW : HIGH);
#endif
  g_buzzerOn = on;
}

inline void stopBuzzer()
{
  g_buzzerActive = false;
  g_buzzerRemainingBeeps = 0;
  setBuzzerOutput(false);
}

inline void initBuzzer()
{
  pinMode(BUZZER_PIN, OUTPUT);
  stopBuzzer();
  Serial.print(F("[BUZZER] Init OK. GPIO"));
  Serial.println(BUZZER_PIN);
}

inline void startBuzzerPattern(uint8_t beepCount)
{
  if (beepCount == 0)
  {
    stopBuzzer();
    return;
  }

  g_buzzerActive = true;
  g_buzzerRemainingBeeps = beepCount;
  setBuzzerOutput(true);
  g_buzzerNextToggleMs = millis() + BUZZER_BEEP_DURATION_MS;
}

inline void loopBuzzer()
{
  if (!g_buzzerActive)
    return;

  const uint32_t now = millis();
  if ((int32_t)(now - g_buzzerNextToggleMs) < 0)
    return;

  if (g_buzzerOn)
  {
    setBuzzerOutput(false);
    g_buzzerRemainingBeeps--;
    if (g_buzzerRemainingBeeps == 0)
    {
      g_buzzerActive = false;
      return;
    }
    g_buzzerNextToggleMs = now + BUZZER_BEEP_GAP_MS;
    return;
  }

  setBuzzerOutput(true);
  g_buzzerNextToggleMs = now + BUZZER_BEEP_DURATION_MS;
}
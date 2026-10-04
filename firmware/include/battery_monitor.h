#pragma once

#include <Arduino.h>
#include "config.h"

#if CONFIG_IDF_TARGET_ESP32C3
static const uint8_t BATTERY_ADC_PIN = 0; // A0 on the ESP32-C3 Super Mini
#else
static const uint8_t BATTERY_ADC_PIN = 34; // ADC1 input-only pin on ESP32 DevKit V1
#endif

#if ACTUATOR_TYPE == ACTUATOR_SERVO
static constexpr float BATTERY_DIVIDER_TOP_OHM = 100000.0f;
static constexpr float BATTERY_DIVIDER_BOTTOM_OHM = 100000.0f;
static constexpr uint8_t BATTERY_SERIES_CELLS = 1;
#else
static constexpr float BATTERY_DIVIDER_TOP_OHM = 100000.0f;
static constexpr float BATTERY_DIVIDER_BOTTOM_OHM = 27000.0f;
static constexpr uint8_t BATTERY_SERIES_CELLS = 3;
#endif

static void initBatteryMonitor()
{
  analogReadResolution(12);
  analogSetPinAttenuation(BATTERY_ADC_PIN, ADC_11db);
  pinMode(BATTERY_ADC_PIN, INPUT);
  Serial.print(F("[BATTERY] ADC initialized on GPIO"));
  Serial.println(BATTERY_ADC_PIN);
}

static float readBatteryVoltage()
{
  uint32_t totalMillivolts = 0;
  constexpr uint8_t SAMPLE_COUNT = 8;
  for (uint8_t sample = 0; sample < SAMPLE_COUNT; ++sample)
    totalMillivolts += analogReadMilliVolts(BATTERY_ADC_PIN);

  const float adcVoltage = (totalMillivolts / static_cast<float>(SAMPLE_COUNT)) / 1000.0f;
  const float dividerRatio =
      (BATTERY_DIVIDER_TOP_OHM + BATTERY_DIVIDER_BOTTOM_OHM) /
      BATTERY_DIVIDER_BOTTOM_OHM;
  return adcVoltage * dividerRatio;
}

static uint8_t batteryPercentFromVoltage(float packVoltage)
{
  const float cellVoltage = packVoltage / BATTERY_SERIES_CELLS;

  struct VoltagePoint
  {
    float voltage;
    uint8_t percent;
  };
  static constexpr VoltagePoint points[] = {
      {4.20f, 100},
      {4.10f, 90},
      {4.00f, 80},
      {3.90f, 65},
      {3.80f, 50},
      {3.70f, 35},
      {3.60f, 20},
      {3.50f, 10},
      {3.30f, 3},
      {3.20f, 0},
  };

  constexpr size_t pointCount = sizeof(points) / sizeof(points[0]);
  if (cellVoltage >= points[0].voltage)
    return 100;
  if (cellVoltage <= points[pointCount - 1].voltage)
    return 0;

  for (size_t index = 0; index + 1 < pointCount; ++index)
  {
    const VoltagePoint &high = points[index];
    const VoltagePoint &low = points[index + 1];
    if (cellVoltage <= high.voltage && cellVoltage >= low.voltage)
    {
      const float fraction = (cellVoltage - low.voltage) /
                             (high.voltage - low.voltage);
      const float percent = low.percent + fraction * (high.percent - low.percent);
      return static_cast<uint8_t>(constrain(percent, 0.0f, 100.0f));
    }
  }

  return 0;
}

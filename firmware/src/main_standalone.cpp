#include <Arduino.h>
#include "config.h"
#include "rfid.h"
#include "led.h"
#include "relay.h"
#include "buzzer.h"
#include "whitelist.h"

// How long (ms) to hold the LED result before accepting the next card tap.
static const uint32_t LED_RESULT_DISPLAY_MS = 2000;

static bool g_showingResult = false;
static uint32_t g_resultShownAt = 0;

void setup()
{
  Serial.begin(115200); // kept idle for future debugging, no prints in normal flow
  delay(1500);          // native USB-C CDC needs time to re-enumerate after reset, else early prints are lost
  Serial.println(F("[BOOT] Standalone Smart Lock starting..."));

  initRfid();
  initLeds();
  initRelay();
  initBuzzer();
  Serial.println(F("[BOOT] Ready."));
}

void loop()
{
  loopRelay();
  loopBuzzer();

  if (g_showingResult)
  {
    if (millis() - g_resultShownAt >= LED_RESULT_DISPLAY_MS)
    {
      g_showingResult = false;
      clearLeds();
    }
    return;
  }

  String uid = readCardUID();
  if (uid.length() == 0)
  {
    return;
  }

  const bool allowed = isUidAllowed(uid);
  if (allowed)
  {
    unlockRelay(RELAY_UNLOCK_DURATION_MS);
    startBuzzerPattern(2);
  }
  else
  {
    lockRelay();
    Serial.print(F("[RFID] Unregistered UID: "));
    Serial.println(uid);
    startBuzzerPattern(1);
  }
  setAccessLeds(allowed);

  g_showingResult = true;
  g_resultShownAt = millis();
}

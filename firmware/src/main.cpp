#include <Arduino.h>
#include "display.h"
#include "rfid.h"

// How long (ms) to show the UID before returning to idle screen
static const uint32_t UID_DISPLAY_DURATION_MS = 3000;

// Replace these sample UIDs with your real registered cards.
static const char *AUTHORIZED_UIDS[] = {
    "49 63 DE 6E",
    "12 34 56 78"
};
static const size_t AUTHORIZED_UID_COUNT = sizeof(AUTHORIZED_UIDS) / sizeof(AUTHORIZED_UIDS[0]);

static uint32_t g_uidShownAt   = 0;
static bool     g_showingUID   = false;

bool isAuthorizedCard(const String &uid) {
    for (size_t i = 0; i < AUTHORIZED_UID_COUNT; i++) {
        if (uid.equals(AUTHORIZED_UIDS[i])) {
            return true;
        }
    }
    return false;
}

void setup() {
    Serial.begin(115200);
    Serial.println(F("[BOOT] Smart Lock starting..."));

    if (!initDisplay()) {
        // OLED failed — keep retrying in loop; log to serial only
        Serial.println(F("[BOOT] OLED init failed. Halting."));
        while (true) { delay(1000); }
    }

    showMessage("Smart Lock", "Initializing...");
    Serial.println(F("[BOOT] OLED OK"));

    initRfid();
    Serial.println(F("[BOOT] RFID OK"));

    showMessage("Smart Lock", "Tap your card...");
    Serial.println(F("[BOOT] Ready."));
}

void loop() {
    uint32_t now = millis();

    // If UID is being shown, wait for display duration then return to idle
    if (g_showingUID) {
        if (now - g_uidShownAt >= UID_DISPLAY_DURATION_MS) {
            g_showingUID = false;
            showMessage("Smart Lock", "Tap your card...");
        }
        return;
    }

    // Try to read a card
    String uid = readCardUID();
    if (uid.length() == 0) {
        return;
    }

    bool granted = isAuthorizedCard(uid);

    Serial.print(F("[RFID] Card UID: "));
    Serial.print(uid);
    Serial.print(F(" | Access: "));
    Serial.println(granted ? F("GRANTED") : F("DENIED"));

    showAccessResult(granted, uid);
    g_showingUID = true;
    g_uidShownAt = now;
}

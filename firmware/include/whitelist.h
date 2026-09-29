#pragma once

#include <Arduino.h>

// Hardcoded UID whitelist for standalone (no-backend) builds.
// Format must match readCardUID() output: uppercase hex bytes separated by spaces.
// Replace/add entries with your actual card UIDs before flashing.
static const char *const ALLOWED_UIDS[] = {
    "0A 7E 72 81",          // Blue Tag 
    "49 63 DE 6E",          // White Card
    "18 90 35 35 40 7A 2B", // KTP
};
static const size_t ALLOWED_UIDS_COUNT = sizeof(ALLOWED_UIDS) / sizeof(ALLOWED_UIDS[0]);

inline bool isUidAllowed(const String &uid)
{
  for (size_t i = 0; i < ALLOWED_UIDS_COUNT; i++)
  {
    if (uid.equals(ALLOWED_UIDS[i]))
      return true;
  }
  return false;
}

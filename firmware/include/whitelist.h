#pragma once

#include <Arduino.h>

// Hardcoded UID whitelist for standalone (no-backend) builds.
// Format must match readCardUID() output: uppercase hex bytes separated by spaces.
// Replace/add entries with your actual card UIDs before flashing.
static const char *const ALLOWED_UIDS[] = {
    "A3 4F 2B 11",
    "18 90 35 35 40 7A 2B",
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

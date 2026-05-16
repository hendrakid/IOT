---
description: "Troubleshoot hardware issues with ESP32, MFRC522 RFID, OLED display, Relay module, or WiFi connectivity. Diagnoses common problems and suggests fixes."
agent: "agent"
---
I'm having a hardware issue with my Smart Lock / Absensi RFID project.

Please help me diagnose and fix the problem:

1. **Identify** the most likely cause based on my symptoms
2. **Check wiring** — verify pin connections against the project's wiring reference
3. **Check code** — verify initialization and library usage
4. **Suggest fixes** — step-by-step resolution, starting with the simplest
5. **Verify** — how to confirm the fix worked (Serial output, OLED message, etc.)

Common issues to check:
- MFRC522: not detecting cards → SPI wiring, RST pin, 3.3V power, library init
- OLED: blank screen → I2C address (0x3C vs 0x3D), SDA/SCL swap, display.begin() call
- Relay: not switching → GPIO pin choice (not input-only), active LOW vs HIGH, 5V power
- WiFi: not connecting → SSID/password, signal strength, WiFi.begin() timing
- General: brownout/reset → insufficient power, too many modules on 3.3V rail

My issue:

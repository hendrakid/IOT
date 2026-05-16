---
description: "Use when asking about wiring, pin connections, hardware setup, schematic, physical assembly, component specs, SPI/I2C interface, GPIO assignment, or voltage levels for ESP32, MFRC522, OLED, or Relay."
---
# Hardware & Wiring Reference

## Component Specifications

| Component | Model | Interface | Voltage | Notes |
|-----------|-------|-----------|---------|-------|
| Microcontroller | ESP32 DevKit V1 | — | 3.3V logic, 5V USB power | 38 pins, dual-core, WiFi+BT |
| RFID Reader | MFRC522 | **SPI** | 3.3V | 13.56 MHz, Mifare Classic/Ultralight |
| OLED Display | SSD1306 0.96" 128x64 | **I2C** | 3.3V–5V | Address: 0x3C |
| Relay Module | 5V 1-Channel | **Digital GPIO** | 5V coil, 3.3V signal OK | Active LOW (most modules) |
| Power Supply | 12V Adaptor | — | 12V DC | For solenoid/external loads |

## ESP32 Pin Capabilities & Constraints

### Pins to AVOID for output:
| GPIO | Reason |
|------|--------|
| 34, 35, 36, 39 | **Input-only** — cannot be used for output (no internal pull-up) |
| 6, 7, 8, 9, 10, 11 | **Reserved** — connected to internal flash SPI |
| 0 | Boot button — pulling LOW during boot enters flash mode |
| 2 | On-board LED on some boards; must be LOW or floating during boot |
| 12 | Boot fail if pulled HIGH during boot (MTDI strapping pin) |
| 15 | Outputs PWM signal at boot (MTDO strapping pin) |

### SPI Pins (VSPI — default):
| Function | GPIO | Fixed? |
|----------|------|--------|
| SCK (Clock) | 18 | Yes (hardware SPI) |
| MOSI (Master Out) | 23 | Yes (hardware SPI) |
| MISO (Master In) | 19 | Yes (hardware SPI) |
| SS/SDA (Chip Select) | 5 | No — configurable |

### I2C Pins (default):
| Function | GPIO | Fixed? |
|----------|------|--------|
| SDA (Data) | 21 | No — configurable, but 21 is default |
| SCL (Clock) | 22 | No — configurable, but 22 is default |

## Pin Assignment (This Project)

| ESP32 GPIO | Connected To | Interface | Notes |
|------------|-------------|-----------|-------|
| GPIO 5 | MFRC522 SDA (SS) | SPI | Chip select for RFID |
| GPIO 18 | MFRC522 SCK | SPI | SPI clock (hardware) |
| GPIO 23 | MFRC522 MOSI | SPI | SPI data out (hardware) |
| GPIO 19 | MFRC522 MISO | SPI | SPI data in (hardware) |
| GPIO 4 | MFRC522 RST | Digital | Reset pin (avoid GPIO22 — conflicts with I2C SCL) |
| GPIO 21 | OLED SDA | I2C | I2C data line |
| GPIO 22 | OLED SCL | I2C | I2C clock line |
| GPIO 26 | Relay IN | Digital | Relay control signal |
| 3.3V | MFRC522 VCC, OLED VCC | Power | 3.3V rail from ESP32 |
| 5V (VIN) | Relay VCC | Power | 5V from USB or external |
| GND | All GND pins | Power | Common ground — ALL components share GND |

## Wiring Diagram (ASCII)

```
                         ESP32 DevKit V1
                    ┌──────────────────────┐
                    │                      │
    MFRC522 SDA ◄──┤ GPIO 5          3V3  ├──► MFRC522 VCC + OLED VCC
    MFRC522 SCK ◄──┤ GPIO 18         GND  ├──► Common GND (all modules)
   MFRC522 MOSI ◄──┤ GPIO 23         5V   ├──► Relay VCC
   MFRC522 MISO ◄──┤ GPIO 19              │
    MFRC522 RST ◄──┤ GPIO 4               │
                    │                      │
      OLED SDA  ◄──┤ GPIO 21              │
      OLED SCL  ◄──┤ GPIO 22              │
                    │                      │
      Relay IN  ◄──┤ GPIO 26              │
                    │                      │
                    └──────────────────────┘

    MFRC522:  VCC→3.3V  GND→GND  SDA→G5  SCK→G18  MOSI→G23  MISO→G19  RST→G4
    OLED:     VCC→3.3V  GND→GND  SDA→G21  SCL→G22
    Relay:    VCC→5V    GND→GND  IN→G26

    ⚠️  Relay COM/NO → External load (solenoid lock + 12V adaptor)
```

## Power Distribution

```
USB 5V ──┬──► ESP32 VIN (powers the board)
          └──► Relay VCC (5V coil power)

ESP32 3.3V regulator output ──┬──► MFRC522 VCC (3.3V only!)
                              └──► OLED VCC (3.3V–5V)

12V Adaptor ──► Solenoid Lock (via Relay NO/COM contacts)
               ⚠️ Do NOT connect 12V to ESP32 or logic pins!
```

## Critical Warnings

1. **MFRC522 is 3.3V only** — connecting to 5V will damage it
2. **GPIO 34-39 are input-only** — never assign output devices (relay, LED) to these pins
3. **GPIO 6-11 are off-limits** — used by internal flash memory
4. **Common GND is mandatory** — all modules must share the same ground
5. **MFRC522 RST uses GPIO 4** (not GPIO 22) — GPIO 22 is already used by I2C SCL for OLED
6. **Relay module**: most modules are active LOW (IN pin LOW = relay ON). Verify your module's behavior
7. **12V adaptor**: only connects to solenoid through relay contacts. Never to ESP32 pins

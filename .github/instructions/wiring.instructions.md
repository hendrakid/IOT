---
description: "Use when asking about wiring, pin connections, hardware setup, schematic, physical assembly, component specs, SPI/I2C interface, GPIO assignment, or voltage levels for ESP32, MFRC522, OLED, or Relay."
---
# Hardware & Wiring Reference

## Component Specifications

| Component | Model | Interface | Voltage | Notes |
|-----------|-------|-----------|---------|-------|
| Microcontroller | ESP32 DevKit V1 (CP2102, USB Type-C) | — | 3.3V logic, 5V USB power | 38 pins, dual-core, WiFi+BT |
| RFID Reader | RFID-RC522 (MFRC522) | **SPI** | 3.3V | 13.56 MHz, Mifare Classic/Ultralight; pins: SDA, SCK, MOSI, MISO, IRQ, GND, RST, 3.3V |
| OLED Display | SSD1306 0.96" 128x64 | **I2C** | 3.3V–5V | Address: 0x3C; pin order on module: **GND, VDD, SCK, SDA** |
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
| — | MFRC522 IRQ | — | **Leave unconnected** (not used in this project) |
| GPIO 21 | OLED SDA (pin 4 on module) | I2C | I2C data line |
| GPIO 22 | OLED SCK/SCL (pin 3 on module) | I2C | I2C clock line — module label is "SCK" |
| GPIO 26 | Relay IN | Digital | Relay control signal |
| 3.3V | MFRC522 VCC, OLED VCC | Power | 3.3V rail from ESP32 |
| 5V (VIN) | Relay VCC | Power | 5V from USB or external |
| GND | All GND pins | Power | Common ground — ALL components share GND |

## Wiring Diagram (ASCII)

```
  RFID-RC522 (MFRC522)          ESP32 DevKit V1 (CP2102)           RELAY MODULE
  ┌─────────────┐           ┌──────────────────────────┐          ┌─────────────┐
  │        3.3V ├───────────┤ 3V3 ●              ● VIN ├──────────┤ VCC         │
  │         RST ├───────────┤ D4  ●              ● GND ├────┐     │ GND ────────┼──┐
  │         GND ├────────┬──┤ GND ●              ● D13 │    │     │ IN  ────────┼──┼──── D26
  │         IRQ │  (NC)  │  │ D15 ●              ● D12 │    │     ├─────────────┤  │
  │        MISO ├─────── ┼──┤ D19 ●              ● D14 │    │     │ COM ──┐     │  │
  │        MOSI ├────────┼──┤ D23 ●              ● D27 │    │     │ NO  ──┼─ Solenoid Lock (+)
  │         SCK ├────────┼──┤ D18 ●              ● D26 ├────┼──►  │ NC    │  (unused)
  │         SDA ├────────┼──┤ D5  ●              ● D25 │    │     └───────┼─────┘  │
  └─────────────┘        │  │ TX2 ●              ● D33 │    │             │        │
                         │  │ RX2 ●              ● D32 │    │      12V Adaptor (+) │
  OLED SSD1306            │  │ D21 ●──────────┐  ● D35 │    │      Solenoid GND    │
  (pin order on module)   │  │ RX0 ●          │  ● D34 │    │      ↕ 12V circuit   │
  ┌─────────────┐        │  │ TX0 ●          │  ● VN  │    │      (isolated from  │
  │ 1: GND ─────┼────────┴──┤ GND ●          │  ● VP  │    │       ESP32 logic)   │
  │ 2: VDD ─────┼───────────┤ 3V3 ●          │  ● EN  │    │                      │
  │ 3: SCK ─────┼───────────┤ D22 ●          │        │    │                      │
  │ 4: SDA ─────┼───────────┤ D21 ●◄─────────┘        │    └──────────────────────┘
  └─────────────┘           │      [USB Type-C]        │    (Common GND rail)
                            └──────────────────────────┘

  Connection Summary:
  ┌─────────────────┬──────────────┬─────────────────────────────────────────────┐
  │ Module          │ Module Pin   │ ESP32 Pin                                   │
  ├─────────────────┼──────────────┼─────────────────────────────────────────────┤
  │ RFID-RC522      │ 3.3V         │ 3V3                                         │
  │                 │ GND          │ GND                                         │
  │                 │ SDA (SS)     │ D5  (GPIO 5)                                │
  │                 │ SCK          │ D18 (GPIO 18)                               │
  │                 │ MOSI         │ D23 (GPIO 23)                               │
  │                 │ MISO         │ D19 (GPIO 19)                               │
  │                 │ RST          │ D4  (GPIO 4)                                │
  │                 │ IRQ          │ — (leave unconnected / NC)                  │
  ├─────────────────┼──────────────┼─────────────────────────────────────────────┤
  │ OLED SSD1306    │ GND (pin 1)  │ GND                                         │
  │                 │ VDD (pin 2)  │ 3V3                                         │
  │                 │ SCK (pin 3)  │ D22 (GPIO 22) — I2C SCL                    │
  │                 │ SDA (pin 4)  │ D21 (GPIO 21) — I2C SDA                    │
  ├─────────────────┼──────────────┼─────────────────────────────────────────────┤
  │ Relay Module    │ VCC          │ VIN (5V)                                    │
  │                 │ GND          │ GND                                         │
  │                 │ IN           │ D26 (GPIO 26)                               │
  │                 │ COM + NO     │ → 12V solenoid circuit (isolated)           │
  └─────────────────┴──────────────┴─────────────────────────────────────────────┘

  ⚠️  Relay COM/NO → External load (solenoid lock + 12V adaptor)
  ⚠️  All modules share the same GND rail on ESP32
```

## Power Distribution

```
USB 5V ──┬──► ESP32 VIN (powers the board)
          └──► Relay VCC (5V coil power)

ESP32 3.3V regulator output ──┬──► MFRC522 3.3V (3.3V only!)
                              └──► OLED VDD (3.3V–5V)

12V Adaptor ──► Solenoid Lock (via Relay NO/COM contacts)
               ⚠️ Do NOT connect 12V to ESP32 or logic pins!
```

## Critical Warnings

1. **MFRC522 is 3.3V only** — connecting to 5V will damage it; power from ESP32's 3.3V pin
2. **GPIO 34-39 are input-only** — never assign output devices (relay, LED) to these pins
3. **GPIO 6-11 are off-limits** — used by internal flash memory
4. **Common GND is mandatory** — all modules must share the same ground
5. **MFRC522 RST uses GPIO 4** (not GPIO 22) — GPIO 22 is already used by I2C SCL (OLED SCK)
6. **MFRC522 IRQ pin** — leave unconnected; not needed for polling-mode reads
7. **OLED pin order on this module: GND (1), VDD (2), SCK (3), SDA (4)** — the "SCK" label on the OLED = I2C SCL; connect to GPIO 22
8. **Relay module**: most modules are active LOW (IN pin LOW = relay ON). Verify your module's behavior
9. **12V adaptor**: only connects to solenoid through relay contacts. Never to ESP32 pins

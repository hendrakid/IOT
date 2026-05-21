---
description: "Use when asking about wiring, pin connections, hardware setup, schematic, physical assembly, component specs, SPI/I2C interface, GPIO assignment, or voltage levels for ESP32, MFRC522, OLED, or Relay."
---
# Hardware & Wiring Reference

## Hardware Evidence Policy (Mandatory)

Before giving wiring guidance or updating this file:

1. Review hardware photos in `.github/hardware pics`.
2. Validate module identity and printed pin labels from the photos.
3. Only include Module Pinout (ASCII) for components that have photo evidence. Do not draw connection lines between modules in the ASCII diagram — use Connection Summary for wiring info.
4. If a component photo is missing, mark it as **Pending Hardware Evidence** and do not include its ASCII pinout diagram.

Current evidence in `.github/hardware pics`:

- `EPS DEVKIT V1 CP2102 Type C.jpeg` (ESP32 DevKit V1)
- `RFID RC522.jpeg` (MFRC522 module)
- `OLED 0.96 128x64 I2C IIC.jpeg` (SSD1306 OLED, pin order visible: GND, VDD, SCK, SDA)
- `LED Red and Blue.jpeg` (5mm status LEDs — red = denied, blue = granted)
- `Relay 1-Channel (5V DC).jpeg` (5V 1-channel relay module — JQC-3FF-S-Z, VCC/GND/IN, NC/COM/NO)

## Component Specifications

| Component | Model | Interface | Voltage | Notes |
|-----------|-------|-----------|---------|-------|
| Microcontroller | ESP32 DevKit V1 (CP2102, USB Type-C) | — | 3.3V logic, 5V USB power | 38 pins, dual-core, WiFi+BT |
| RFID Reader | RFID-RC522 (MFRC522) | **SPI** | 3.3V | 13.56 MHz, Mifare Classic/Ultralight; pins: SDA, SCK, MOSI, MISO, IRQ, GND, RST, 3.3V |
| OLED Display | SSD1306 0.96" 128x64 | **I2C** | 3.3V–5V | Address: 0x3C; pin order on module: **GND, VDD, SCK, SDA** |
| Status LED (blue) | 5mm through-hole | **Digital GPIO** | 3.3V via 100Ω resistor | Access granted indicator; anode (+) long leg |
| Status LED (red) | 5mm through-hole | **Digital GPIO** | 3.3V via 100Ω resistor | Access denied / server error; anode (+) long leg |
| Relay Module | 5V 1-Channel (JQC-3FF-S-Z) | **Digital GPIO (open-drain)** | 5V coil; IN needs 5V HIGH to turn off | Active LOW on IN (verified); **4.7k–10kΩ pull-up IN→5V** required with ESP32 3.3V GPIO; GPIO 26 |
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
| GPIO 25 | Blue LED anode (via 100Ω) | Digital | Access granted — active HIGH |
| GPIO 27 | Red LED anode (via 100Ω) | Digital | Access denied / server error — active HIGH |
| GPIO 26 | Relay IN | Open-drain | Active LOW; **10kΩ IN→5V (VIN)** required — 3.3V alone cannot turn relay off |
| 3.3V | MFRC522 VCC, OLED VCC | Power | 3.3V rail from ESP32 |
| 5V (VIN) | Relay VCC, pull-up for IN | Power | 5V coil + logic pull-up (same 5V rail) |
| GND | All GND pins | Power | Common ground — ALL components share GND |

## Module Pinout Reference (ASCII)

> Pin labels match physical markings on each module as seen in `.github/hardware pics`. No connection lines are drawn here — see Connection Summary for wiring info.

### ESP32 DevKit V1 (CP2102, USB Type-C)

```
   
 ESP32 DevKit V1 (CP2102)
  ┌────[USB Type C]────┐
 ●│3V3              VIN│●
 ●│GND              GND│●
 ●│D15              D13│●
 ●│D2               D12│●
 ●│D4               D14│●
 ●│RX2              D27│●
 ●│TX2              D26│●
 ●│D5               D25│●
 ●│D18              D33│●
 ●│D19              D32│●
 ●│D21              D35│●
 ●│TX0              VN │●
 ●│RX0              D34│●
 ●│D22              VP │●
 ●│D23              EN │●
  └────────────────────┘
```

### RFID-RC522 (MFRC522)

```
  ┌─────────┐
  │ SDA     │
  │ SCK     │
  │ MOSI    │
  │ MISO    │
  │ IRQ     │
  │ GND     │
  │ RST     │
  │ 3.3V    │
  └─────────┘
```

### OLED SSD1306 (0.96" 128×64, I2C)

```
  ┌─────────────────────┐
  │ GND  VDD  SCK  SDA  │
  └─────────────────────┘
```

### Relay Module (5V 1-Channel)

```
  ┌─────────────────────────┐
  │ NC    COM    NO          │  ← screw terminals (load side)
  │                         │
  │      [JQC-3FF-S-Z]      │
  │                         │
  │  VCC   GND   IN         │  ← header pins (control side)
  └─────────────────────────┘
```

Lock mode: **energize to unlock** — use **COM + NO** for 12V solenoid; NC unused.

### Relay IN — 3.3V GPIO vs 5V module (verified on this hardware)

ESP32 drives **3.3V**; this module needs **IN at ~5V** to turn the coil off (green **SW** LED off):

| IN connection | SW LED | Coil |
|---------------|--------|------|
| GND | ON | Energized (unlock) |
| 5V (VIN) | OFF | De-energized (locked) |
| GPIO 26 HIGH (3.3V only) | **Stays ON** | Stuck on — insufficient HIGH |

**Required:** resistor **4.7kΩ–10kΩ** from **IN** to **5V (VIN)**. GPIO 26 → **IN** (open-drain in firmware). Locked = GPIO floats high via pull-up; unlock = GPIO pulls IN to GND.

```
5V (VIN) ──┬── Relay VCC
           │
          [10kΩ]
           │
           ├── Relay IN ◄── GPIO 26 (D26, open-drain)
           │
Relay GND ─┴── ESP32 GND
```

---

## Wiring Diagram (Manual)

Wiring diagram will be added manually.
         
  RFID-RC522 (MFRC522)                  ESP32 DevKit V1 (CP2102)
  ┌─────────────┐                       ┌────[USB Type C]────┐
  │    3.3V     │●─────────────────┌───●│3V3              VIN│●
  │     RST     │●───────┐      ┌──┼┌──●│GND              GND│●
  │     GND     │●───────┼──────┘  ││  ●│D15              D13│●
  │     IRQ     │●       │         ││  ●│D2               D12│●
  │    MISO     │●────┐  └─────────┼┼──●│D4               D14│●
  │    MOSI     │●───┐│            ││  ●│RX2              D27│●
  │     SCK     │●──┐││            ││  ●│TX2              D26│●
  │     SDA     │●──┼┼┼────────────┼┼──●│D5               D25│●
  └─────────────┘   └┼┼────────────┼┼──●│D18              D33│●
                     │└────────────┼┼──●│D19              D32│●
                     │           ┌─┼┼──●│D21              D35│●
                     │           │ ││  ●│TX0              VN │●
                     │           │ ││  ●│RX0              D34│●
                     │           │┌┼┼──●│D22              VP │●
                     └───────────┼┼┼┼──●│D23              EN │●
                                 ││││   └────────────────────┘
OLED SSD1306                     ││││
(pin order on module)            ││││
┌────────────┐                   ││││
│     GND    │●──────────────────┼┼┼┘
│     VDD    │●──────────────────┼┼┘
│     SCK    │●──────────────────┼┘
│     SDA    │●──────────────────┘
└────────────┘

---

## Connection Summary

```
  ┌─────────────────┬──────────────┬─────────────────────────────────────────────┐
  │ Module          │ Module Pin   │ ESP32 Pin                                   │
  ├─────────────────┼──────────────┼─────────────────────────────────────────────┤
  │ RFID-RC522      │ SDA (SS)     │ D5  (GPIO 5)                                │
  │                 │ SCK          │ D18 (GPIO 18)                               │
  │                 │ MOSI         │ D23 (GPIO 23)                               │
  │                 │ MISO         │ D19 (GPIO 19)                               │
  │                 │ IRQ          │ — (leave unconnected / NC)                  │
  │                 │ GND          │ GND                                         │
  │                 │ RST          │ D4  (GPIO 4)                                │
  │                 │ 3.3V         │ 3V3                                         │
  ├─────────────────┼──────────────┼─────────────────────────────────────────────┤
  │ OLED SSD1306    │ GND (pin 1)  │ GND                                         │
  │                 │ VDD (pin 2)  │ 3V3                                         │
  │                 │ SCK (pin 3)  │ D22 (GPIO 22) — I2C SCL                    │
  │                 │ SDA (pin 4)  │ D21 (GPIO 21) — I2C SDA                    │
  ├─────────────────┼──────────────┼─────────────────────────────────────────────┤
  │ Blue LED 5mm    │ Anode (+)    │ D25 (GPIO 25) via 100Ω resistor            │
  │                 │ Cathode (-)  │ GND                                         │
  │ Red LED 5mm     │ Anode (+)    │ D27 (GPIO 27) via 100Ω resistor            │
  │                 │ Cathode (-)  │ GND                                         │
  ├─────────────────┼──────────────┼─────────────────────────────────────────────┤
  │ Relay 1-ch 5V   │ VCC          │ 5V (VIN) — coil needs 5V, not 3.3V         │
  │                 │ GND          │ GND                                         │
  │                 │ IN           │ D26 (GPIO 26) — open-drain, active LOW   │
  │ (external)      │ IN pull-up   │ 4.7k–10kΩ from IN to 5V (VIN) — required │
  └─────────────────┴──────────────┴─────────────────────────────────────────────┘

  All verified modules share the same GND rail on ESP32

  Relay IN path: 5V ──[10kΩ]── IN ◄── GPIO 26 (open-drain). Do NOT rely on 3.3V HIGH alone.

  LED path (each LED): GPIO → 100Ω resistor → anode (+) → cathode (-) → GND
  Do NOT connect LED directly to GPIO without a current-limiting resistor.

  Solenoid 12V (energize to unlock, via relay contacts — NOT to ESP32 pins):
    12V+ ──► Solenoid (+) ──► Solenoid (-) ──► COM
    NO  ◄── (closes to COM when relay active / access granted)
    NC  — leave unused for this lock mode
    12V GND ──► adaptor GND (keep load circuit separate from logic; share GND with ESP32 only if required)
```

## Power Distribution

```
USB 5V ──► ESP32 VIN (powers the board)
         ├──► Relay VCC (5V coil)
         └──► Relay IN pull-up (4.7k–10kΩ from IN to this 5V rail)

ESP32 3.3V regulator output ──┬──► MFRC522 3.3V (3.3V only!)
                              └──► OLED VDD (3.3V–5V)

GPIO 26 (open-drain) ──► Relay IN (LOW = unlock; float + pull-up = locked)

12V adaptor ──► Solenoid ──► Relay COM/NO (load side only)
Do NOT connect 12V to ESP32 or logic pins.
```

## Critical Warnings

1. **MFRC522 is 3.3V only** — connecting to 5V will damage it; power from ESP32's 3.3V pin
2. **GPIO 34-39 are input-only** — never assign output devices (relay, LED) to these pins
3. **GPIO 6-11 are off-limits** — used by internal flash memory
4. **Common GND is mandatory** — all modules must share the same ground
5. **MFRC522 RST uses GPIO 4** (not GPIO 22) — GPIO 22 is already used by I2C SCL (OLED SCK)
6. **MFRC522 IRQ pin** — leave unconnected; not needed for polling-mode reads
7. **OLED pin order on this module: GND (1), VDD (2), SCK (3), SDA (4)** — the "SCK" label on the OLED = I2C SCL; connect to GPIO 22
8. **Status LEDs**: 100Ω resistor in series with each LED; long leg = anode to resistor/GPIO side; GPIO 25 blue (granted), GPIO 27 red (denied)
9. **Relay module**: VCC to 5V (VIN); active LOW on IN; **mandatory 4.7k–10kΩ pull-up IN→5V** — without it, SW LED stays on at idle because ESP32 only outputs 3.3V HIGH
10. **Relay GPIO 26**: firmware uses **open-drain** (`OUTPUT_OPEN_DRAIN` in `relay.h`); locked = float (pull-up → 5V), unlock = LOW
11. **12V adaptor**: only connects to solenoid through relay COM/NO contacts. Never to ESP32 pins
12. **Fail-safe**: relay de-energized (IN at 5V via pull-up) = locked; firmware calls `lockRelay()` on boot, denied access, and server errors

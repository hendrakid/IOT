# FAQ — Smart Lock / Absensi RFID

Dokumen ini mencatat masalah yang pernah ditemui saat perakitan, pengujian, dan debugging, beserta solusi ringkasnya.

## 1) Relay tidak menyala / lampu hijau relay tidak aktif

### Gejala
- Relay tidak bunyi atau tidak aktif saat card valid / unlock touch.
- Log menunjukkan relay diinisialisasi, tetapi output tidak berubah.

### Penyebab paling umum
- Kabel **IN relay** tidak benar-benar terhubung ke GPIO yang dipakai firmware.
- Pada ESP32-C3, pin relay harus sesuai build yang dipakai.
- Supply 5V atau GND relay tidak stabil.

### Solusi
- Pastikan **IN relay** ke pin yang benar:
  - ESP32-C3: **GPIO2**
  - ESP32 DevKit V1: **GPIO26**
- Pastikan **VCC relay** ke **5V** dan **GND common** dengan ESP32.
- Pastikan firmware yang di-flash sesuai board target.
- Cek log serial saat unlock:
  - harus ada `[RELAY] UNLOCK for ... ms`

### Catatan penting
- Jika wire ke **IN** dibiarkan **ngambang**, relay bisa tidak merespons atau perilakunya tidak stabil.
- IN harus punya referensi yang jelas ke rangkaian kontrol yang benar.

---

## 2) Serial log relay menampilkan error `IO 2 is not set as GPIO`

### Gejala
- Muncul log seperti:
  - `[RELAY][ESP32-C3] Init OK (locked). Pin=GPIO2 read=...`
  - lalu warning `__digitalRead(): IO 2 is not set as GPIO`

### Penyebab
- Saat relay dalam kondisi **locked**, firmware mengubah pin menjadi **input/high-Z**.
- Pada kondisi ini, `digitalRead()` bisa memunculkan warning pada ESP32-C3.

### Solusi
- Ini bukan kerusakan hardware.
- Abaikan warning tersebut jika relay masih berfungsi saat `unlockRelay()` dipanggil.
- Jika ingin log bersih, jangan membaca `digitalRead()` pada pin yang sengaja dilepas ke input/high-Z.

---

## 3) ESP32-C3 tidak muncul di Serial Monitor

### Gejala
- Board menyala tetapi tidak ada output serial.

### Penyebab
- Native USB-C pada ESP32-C3 butuh CDC aktif saat boot.
- Build salah atau monitor belum dibuka pada port yang benar.

### Solusi
- Gunakan environment build **ESP32-C3** yang benar.
- Pastikan konfigurasi USB CDC aktif.
- Cabut-colok USB lalu buka Serial Monitor lagi.

---

## 4) RFID tidak terbaca

### Gejala
- Kartu ditempel, tetapi tidak ada UID yang muncul.

### Penyebab
- Wiring SPI salah.
- VCC MFRC522 bukan 3.3V.
- GND tidak common.
- Pin SS / SDA tidak sesuai board.

### Solusi
- Untuk ESP32-C3, pastikan wiring MFRC522 sesuai konfigurasi firmware.
- Pastikan MFRC522 diberi **3.3V**, bukan 5V.
- Cek koneksi SCK, MOSI, MISO, dan RST.

---

## 5) OLED tidak tampil

### Gejala
- Layar kosong atau putih.

### Penyebab
- Jalur I2C salah.
- VCC / GND belum benar.
- Address OLED tidak sesuai.
- Pada **ESP32-C3**, firmware **sengaja tidak memakai OLED** (`DISPLAY_ENABLED=0`) karena pin terbatas.

### Solusi
- **ESP32-C3:** jangan pasang OLED. Status ada di Serial Monitor (`[UI] ...`), LED, dan buzzer. GPIO8 dan GPIO9 dibiarkan kosong.
- **ESP32 DevKit V1:** pastikan OLED diberi daya sesuai modul; SDA GPIO21, SCL GPIO22; alamat I2C **0x3C**.

---

## 6) Relay aktif terus / tidak kembali lock

### Gejala
- Relay tetap aktif setelah unlock.

### Penyebab
- Rangkaian IN relay tidak sesuai active-low.
- Wiring IN ke GPIO langsung tanpa rangkaian pull-up / series yang benar.
- Firmware belum jalan pada mode yang benar.

### Solusi
- Pastikan relay module yang dipakai adalah **active-low** sesuai asumsi firmware.
- Cek jalur IN dan supply 5V relay.
- Pastikan `loopRelay()` berjalan terus di `loop()`.

---

## 7) Card valid tetapi akses ditolak

### Gejala
- UID terbaca, tetapi sistem menolak akses.

### Penyebab
- UID belum terdaftar di whitelist/backend.
- API tidak bisa diakses.
- Access point ID salah.

### Solusi
- Cek data whitelist / backend.
- Pastikan `ACCESS_POINT_ID` sesuai pintu/perangkat.
- Cek koneksi WiFi dan API server.

---

## 8) WiFi gagal konek

### Gejala
- Muncul pesan WiFi error atau retry terus.

### Penyebab
- SSID/password salah.
- IP server API salah.
- Sinyal lemah.

### Solusi
- Cek `WIFI_SSID` dan `WIFI_PASSWORD`.
- Pastikan `API_BASE_URL` benar.
- Dekatkan board ke access point untuk pengujian.

---

## 9) Touch unlock tidak berfungsi

### Gejala
- Sentuh sensor tidak memicu unlock.

### Penyebab
- Wiring OUT sensor salah.
- Sensor tidak diberi 3.3V.
- Pin input firmware tidak sesuai board.

### Solusi
- Pastikan sensor touch diberi **3.3V**.
- Pastikan OUT ke pin yang sesuai firmware.
- Cek log `[TOUCH] Unlock requested`.

---

## 10) Buzzer tidak berbunyi

### Gejala
- Tidak ada bunyi saat granted/denied.

### Penyebab
- Pin buzzer salah.
- Tipe buzzer bukan active buzzer 3.3V.
- Wiring terbalik.

### Solusi
- Cek pin buzzer sesuai board target.
- Pastikan polarity benar.
- Jika buzzer 5V atau arus besar, gunakan driver transistor.

---

## 11) Servo SG90 tidak bergerak / ESP32-C3 reset saat servo bergerak

### Gejala
- Log `[SERVO] UNLOCK` muncul tetapi horn tidak bergerak.
- Board reboot atau USB putus saat grant/touch.

### Penyebab paling umum
- `ACTUATOR_TYPE` masih `ACTUATOR_RELAY`.
- VCC servo ke 3.3V, atau SIG tidak ke **GPIO2**.
- Relay masih terpasang di GPIO2 bersama servo.
- Servo dan MCU berbagi USB 5V; arus stall SG90 membuat brown-out.

### Solusi
- Di `config.h` set `#define ACTUATOR_TYPE ACTUATOR_SERVO`.
- Jangan pasang relay atau solenoid pada varian servo.
- SIG → GPIO2, VCC → **5V**, GND common.
- Pakai **5V terpisah** untuk servo (GND tetap common). USB 5V hanya untuk uji tanpa beban.
- Sesuaikan `SERVO_ANGLE_LOCKED` / `SERVO_ANGLE_UNLOCKED` setelah mekanik pintu diketahui.

---

## Checklist cepat debugging

1. Cek log serial saat boot.
2. Pastikan board target sesuai build.
3. Cek GND common semua modul.
4. Cek VCC setiap modul sesuai tegangan.
5. Cek pin input tidak mengambang.
6. Uji satu modul saja dulu jika ada masalah.

---

## Riwayat masalah yang pernah ditemui

- Relay tidak aktif karena **wire ke IN mengambang**.
- Log relay sempat menampilkan GPIO lama saat build C3.
- `digitalRead()` pada pin relay saat locked memunculkan warning di ESP32-C3.


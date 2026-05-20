---
description: "Current work focus, recent changes, next steps, and active decisions. Read this to know where the project is RIGHT NOW before starting any task."
---

# Active Context — Smart Lock / Absensi RFID

## Current Focus

**Phase 9 — Security & Hardening + Testing** (In Progress)

Active work items:
- **MQTT hardware telemetry** — implemented (server subscriber, DB, SSE, firmware publisher, Docker Mosquitto)
- Authentication middleware live on all protected API routes
- Input validation via Zod schemas implemented on all endpoints
- Multi-page dashboard including `hardware.html` (live node status via MQTT → SSE)
- Rate limiting on `POST /api/scan` **NOT YET implemented** — still pending
- Relay hardware photo not yet available — relay firmware integration blocked
- OTA firmware management — planned, not implemented

## Recent Changes (May 2026)

### MQTT implementation (complete)
- **Broker**: `docker-compose.yml` + `infra/mosquitto/` (Mosquitto on port 1883, anonymous dev)
- **Server**: `web/src/utils/mqttSubscriber.ts` — subscribes `smartlock/ap/+/telemetry` and `.../status`, upserts `access_point_status`, broadcasts SSE
- **Stale job**: `web/src/utils/staleStatusJob.ts` — marks `online=false` when `last_seen_at` > 120s
- **DB**: migration `012_create_access_point_status.sql` — table `access_point_status`
- **API**: `GET /api/hardware/stream` (JWT via `?token=`), access points list includes `status`
- **Firmware**: `firmware/include/mqtt.h` — PubSubClient, periodic telemetry (60s), LWT offline on disconnect
- **Scripts**: `npm run mqtt:test`, `node scripts/verify-mqtt-status.mjs`
- **Docs**: README architecture diagram, `web/docs/api.md` MQTT section updated

### Prior integration (unchanged)
- `POST /api/scan` is the single ESP32 entry point for RFID (HTTP, no JWT)
- SSE scan stream with `?include=`, `?exclude=`, `?access_point_id=` filters
- Migration 011 — `access_point_id` on `attendance`

## Next Steps

1. **Rate limiting** on `POST /api/scan` — highest security priority
2. **Firmware deploy** — set `MQTT_BROKER_HOST` in `config.h` to LAN IP of broker (not `localhost` from ESP32); upload with PlatformIO
3. **Relay integration** — blocked until relay module photo in `.github/hardware pics/`
4. **E2E test coverage** — add tests for scan, MQTT/stale-status, hardware SSE (only `cards.e2e.ts` exists today)
5. **OTA firmware** — planned endpoints in `api.md`, not built
6. **HTTPS** — production reverse proxy

## Active Decisions & Considerations

| Decision | Rationale |
|----------|-----------|
| `POST /api/scan` has no JWT | ESP32 cannot store rotating tokens; rate-limited instead |
| HTTP for scan, MQTT for telemetry | Request/response for access; push for heartbeat/metrics |
| SSE uses `?token=` query param | `EventSource` cannot set request headers |
| MQTT optional on server | Subscriber disabled if `MQTT_URL` unset or `MQTT_ENABLED=false` |
| `MQTT_BROKER_HOST` on ESP32 | Must be LAN IP of broker machine — ESP32 cannot use `localhost` |
| UI + server stale threshold | 120s — `isNodeOnline()` in `app.js` + `staleStatusJob` |
| Relay wiring blocked until photo | Hardware Evidence Policy |
| Fail-to-locked on any error | Security — unknown state must not grant access |
| Card UIDs stored as UPPERCASE hex | ESP32 and API both normalize to uppercase |

## Important Patterns

- All async route handlers use `try/catch → next(err)` pattern
- Zod validation runs at middleware level, before controllers
- Migrations numbered `001_` … `012_` — never skip or edit applied migrations
- `millis()`-based timing in firmware — never `delay()` in production loop
- `loopMqtt()` called at start of `loop()` — non-blocking, before RFID handling

## Known Blockers

- **Relay**: No hardware photo → relay wiring and GPIO control not implemented
- **PlatformIO PATH**: Use full path `C:/Users/DELL/.platformio/penv/Scripts/pio.exe` if `pio` not in shell PATH

## Learnings & Insights

- OLED pin order: GND (1), VDD (2), SCK (3), SDA (4) — SCK = I2C SCL → GPIO 22
- MFRC522 RST on GPIO 4; IRQ unconnected (polling mode)
- MQTT test script must `clearTimeout` + `process.exit(0)` after publish — otherwise false timeout exit code
- Relay: always fail to LOCKED on error

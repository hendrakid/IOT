---
description: "Current work focus, recent changes, next steps, and active decisions. Read this to know where the project is RIGHT NOW before starting any task."
---

# Active Context — Smart Lock / Absensi RFID

## Current Focus

**Phase 9 — Security & Hardening + Phase 9 Testing** (In Progress)

Active work items:
- Authentication middleware live on all protected API routes
- Input validation via Zod schemas implemented on all endpoints
- Stats endpoint (`GET /api/stats`) implemented and mounted
- Migration `011_add_access_point_to_attendance.sql` applied — `attendance` table now has `access_point_id` FK column
- SSE stream supports `?include=`, `?exclude=`, and `?access_point_id=` filter query params
- Multi-page dashboard: `index.html` (login), `dashboard.html`, `access-logs.html`, `user-management.html`, `hardware.html`
- Rate limiting on `POST /api/scan` **NOT YET implemented** — still pending
- Relay hardware photo not yet available — relay firmware integration blocked

## Recent Changes

- Full system integration completed (Phase 6): ESP32 ↔ API ↔ Dashboard works end-to-end
- `POST /api/scan` is the single ESP32 entry point (no JWT required by design)
- SSE stream (`GET /api/scan/stream`) broadcasts scan events; supports `?include=`, `?exclude=`, `?access_point_id=` filter params
- Migration 011 added `access_point_id` column to `attendance` table with index
- Stats controller and route (`GET /api/stats`) added — provides summary counts for dashboard
- Dashboard expanded to multi-page app: login (`index.html`), main (`dashboard.html`), access logs (`access-logs.html`), user management (`user-management.html`), hardware info (`hardware.html`)
- Dashboard: auto-switches to Cards tab + pre-fills UID when unknown card is tapped
- Dashboard: shows attendance toast when known card is tapped
- Firmware: OLED shows Connected/IP on boot, scan result + user name per tap
- Dependency correction: using `bcryptjs` (not `bcrypt`) — type: `@types/bcryptjs`

## Next Steps

1. **Rate limiting** on `POST /api/scan` (ESP32 endpoint) — security hardening (highest priority)
2. **Relay integration** — blocked; requires relay module photo in `.github/hardware pics/` first
3. **HTTPS** — configure reverse proxy for production
4. **E2E test coverage** — only `cards.e2e.ts` exists; need E2E tests for scan, attendance, users, auth, access-points, stats
5. **Firmware relay logic** — implement once relay photo is available

## Active Decisions & Considerations

| Decision | Rationale |
|----------|-----------|
| `POST /api/scan` has no JWT | ESP32 cannot store rotating tokens; rate-limited instead |
| SSE uses `?token=` query param | `EventSource` API cannot set request headers |
| Relay wiring blocked until photo | Hardware Evidence Policy — no ASCII diagram without photo |
| Fail-to-locked on any error | Security requirement — unknown state must not grant access |
| Card UIDs stored as UPPERCASE hex | Consistency — ESP32 and API both normalize to uppercase |

## Important Patterns

- All async route handlers use `try/catch → next(err)` pattern
- Zod validation runs at middleware level, before controllers
- Migrations are numbered and applied in order — never skip or edit existing migrations
- `millis()`-based timing in firmware — never `delay()` in production loop

## Known Blockers

- **Relay**: No hardware photo available → relay ASCII wiring and firmware relay logic not yet implemented


## Learnings & Insights

- OLED pin order on this module: GND (1), VDD (2), SCK (3), SDA (4) — "SCK" label = I2C SCL → GPIO 22
- MFRC522 RST must use GPIO 4 (not 22 — already used by OLED SCK/SCL)
- MFRC522 IRQ pin: leave unconnected — not needed for polling-mode operation
- Relay module: always fail to LOCKED state on error — never assume safe = open

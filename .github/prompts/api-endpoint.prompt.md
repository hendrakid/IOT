---
description: "Generate a complete REST API endpoint with Express.js route, controller, database model, and the corresponding ESP32 HTTP client code to call it."
agent: "agent"
---
Generate a complete API endpoint for my Smart Lock / Absensi RFID project.

Produce the following files/code:

1. **Express Route** (`web/src/routes/`) — RESTful route definition with proper HTTP method
2. **Controller** (`web/src/controllers/`) — Request handler with input validation, error handling
3. **Database Query/Model** — Parameterized PostgreSQL query (never string concatenation)
4. **ESP32 HTTP Client Code** — Arduino/ESP32 code using HTTPClient to call this endpoint, with ArduinoJson for serialization
5. **Test** — Jest/Vitest test for the endpoint

Follow these rules:
- TypeScript with type hints for all web code
- Semicolons in all JS/TS
- Parameterized queries only (SQL injection prevention)
- Validate inputs at the route level
- Return consistent JSON shape: `{ "success": boolean, "data": ..., "error": ... }`
- ESP32 code must handle HTTP errors gracefully and display status on OLED

The endpoint I need:

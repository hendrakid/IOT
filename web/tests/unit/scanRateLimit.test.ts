/**
 * Rate limit tests for POST /api/scan.
 * Uses a fresh limiter instance with a low max (not the app singleton).
 */
import supertest from "supertest";
import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../src/middleware/validate";
import { scanSchema } from "../../src/utils/schemas";
import { handleScan } from "../../src/controllers/scanController";

function buildScanApp(max: number): express.Application {
  const app = express();
  app.use(express.json());
  const limiter = rateLimit({
    windowMs: 60_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests" },
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });
  app.post("/api/scan", limiter, validate(scanSchema), handleScan);
  return app;
}

describe("POST /api/scan rate limit", () => {
  it("returns 429 when exceeding max requests in window", async () => {
    const app = buildScanApp(2);
    const agent = supertest(app);

    const body = { uid: "RATELIMIT01" };

    expect((await agent.post("/api/scan").send(body)).status).toBe(200);
    expect((await agent.post("/api/scan").send(body)).status).toBe(200);
    const blocked = await agent.post("/api/scan").send(body);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ success: false, error: "Too many requests" });
  });
});

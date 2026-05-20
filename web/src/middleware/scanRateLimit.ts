import rateLimit from "express-rate-limit";

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 30;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Rate limiter for POST /api/scan (ESP32, no JWT).
 * Keyed by client IP; tune via SCAN_RATE_LIMIT_WINDOW_MS and SCAN_RATE_LIMIT_MAX.
 */
export const scanRateLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.SCAN_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
  max: parsePositiveInt(process.env.SCAN_RATE_LIMIT_MAX, DEFAULT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests" },
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

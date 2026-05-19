import { Router, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { validate } from "../middleware/validate";
import { AuthenticatedRequest } from "../middleware/auth";
import { scanSchema } from "../utils/schemas";
import { addClient, removeClient } from "../utils/scanBroadcast";
import { handleScan } from "../controllers/scanController";

const router = Router();

/**
 * POST /api/scan
 * Called by ESP32 after reading a card. No auth — ESP32 doesn't hold a JWT.
 * Checks if card is registered, records attendance, and broadcasts to dashboard.
 * Rate-limited at the app level (see index.ts).
 */
router.post("/", validate(scanSchema), handleScan);

/**
 * GET /api/scan/stream
 * Server-Sent Events endpoint for the admin dashboard.
 * Dashboard connects here to receive real-time card UID events.
 * Auth via query param ?token=... because EventSource cannot set headers.
 */
router.get(
  "/stream",
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Accept token from query string (EventSource limitation)
    const token =
      (req.query.token as string | undefined) ??
      req.headers.authorization?.slice(7);

    if (!token) {
      res.status(401).json({ success: false, error: "Unauthorized: missing token" });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, error: "Server misconfiguration" });
      return;
    }

    try {
      const payload = jwt.verify(token, secret) as { adminId: number };
      req.adminId = payload.adminId;
      next();
    } catch {
      res.status(401).json({ success: false, error: "Unauthorized: invalid token" });
    }
  },
  (req: AuthenticatedRequest, res: Response): void => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if behind proxy
    res.flushHeaders();

    // Send a heartbeat immediately so the browser knows the connection is open
    res.write(": connected\n\n");

    // Parse include/exclude access_point_id from query string
    const include = req.query.include
      ? String(req.query.include).split(',').map(Number).filter(n => !isNaN(n))
      : undefined;
    const exclude = req.query.exclude
      ? String(req.query.exclude).split(',').map(Number).filter(n => !isNaN(n))
      : undefined;
    const accessPointIdRaw = req.query.access_point_id;
    const parsedAccessPointId = accessPointIdRaw !== undefined ? Number(accessPointIdRaw) : NaN;
    const access_point_id = Number.isInteger(parsedAccessPointId) && parsedAccessPointId > 0
      ? parsedAccessPointId
      : undefined;

    const client = { res, adminId: req.adminId!, include, exclude, access_point_id };
    addClient(client);

    // Heartbeat every 30 s to keep the connection alive through proxies
    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 30_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      removeClient(client);
    });
  }
);

export default router;

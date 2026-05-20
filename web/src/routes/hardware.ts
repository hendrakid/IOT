import { Router, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../middleware/auth";
import { addHardwareClient, removeHardwareClient } from "../utils/hardwareBroadcast";
import { getAccessPointStatusSnapshots } from "../models/accessPointStatus";

const router = Router();

/**
 * GET /api/hardware/stream
 * SSE for hardware status/telemetry updates.
 * Auth via ?token=... (EventSource cannot set headers).
 */
router.get(
  "/stream",
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    res.write(": connected\n\n");

    const client = { res, adminId: req.adminId! };
    addHardwareClient(client);

    try {
      const snapshots = await getAccessPointStatusSnapshots();
      const payload = JSON.stringify({
        type: "snapshot",
        data: snapshots,
        timestamp: new Date().toISOString(),
      });
      res.write(`data: ${payload}\n\n`);
    } catch (err) {
      console.error("[hardware] Failed to send initial snapshot:", err);
    }

    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 30_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      removeHardwareClient(client);
    });
  }
);

export default router;

import { Router, Request, Response } from "express";
import { getSsePublicConfig } from "../utils/sseEnv";

const router = Router();

/**
 * GET /api/config
 * Public SSE filter config for admin pages (no secrets).
 */
router.get("/", (_req: Request, res: Response): void => {
  res.json({ success: true, data: getSsePublicConfig() });
});

export default router;

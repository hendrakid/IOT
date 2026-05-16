import { Router } from "express";
import { listAttendance, createAttendance } from "../controllers/attendanceController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createAttendanceSchema } from "../utils/schemas";

const router = Router();

// GET requires auth (admin only)
router.get("/", requireAuth, listAttendance);

// POST is called by ESP32 — no auth required but input is validated
router.post("/", validate(createAttendanceSchema), createAttendance);

export default router;

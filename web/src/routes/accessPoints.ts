import { Router } from "express";
import {
  listAccessPoints,
  getCardAccessPoints,
  createAccessPoint,
  updateAccessPoint,
  deleteAccessPoint,
} from "../controllers/accessPointsController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /access-points
router.get("/", listAccessPoints);

// GET /access-points/card/:cardId
router.get("/card/:cardId", getCardAccessPoints);

// POST /access-points
router.post("/", requireAuth, createAccessPoint);

// PUT /access-points/:id
router.put("/:id", requireAuth, updateAccessPoint);

// DELETE /access-points/:id
router.delete("/:id", requireAuth, deleteAccessPoint);

export default router;

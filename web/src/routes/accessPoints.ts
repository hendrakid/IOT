import { Router } from "express";
import {
  listAccessPoints,
  getCardAccessPoints,
  createAccessPoint,
  updateAccessPoint,
  deleteAccessPoint,
} from "../controllers/accessPointsController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createAccessPointSchema, updateAccessPointSchema } from "../utils/schemas";

const router = Router();

// GET /access-points
router.get("/", listAccessPoints);

// GET /access-points/card/:cardId
router.get("/card/:cardId", getCardAccessPoints);

// POST /access-points
router.post("/", requireAuth, validate(createAccessPointSchema), createAccessPoint);

// PUT /access-points/:id
router.put("/:id", requireAuth, validate(updateAccessPointSchema), updateAccessPoint);

// DELETE /access-points/:id
router.delete("/:id", requireAuth, deleteAccessPoint);

export default router;

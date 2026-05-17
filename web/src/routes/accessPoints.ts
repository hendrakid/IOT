import { Router } from "express";
import { listAccessPoints, getCardAccessPoints } from "../controllers/accessPointsController";

const router = Router();

// GET /access-points
router.get("/", listAccessPoints);

// GET /access-points/card/:cardId
router.get("/card/:cardId", getCardAccessPoints);

export default router;

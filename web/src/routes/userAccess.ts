import { Router } from "express";
import { listUserAccessPoints, grantUserAccess, revokeUserAccess } from "../controllers/userAccessController";

const router = Router();

// GET /users/:user_id/access-points
router.get("/:user_id/access-points", listUserAccessPoints);

// POST /users/:user_id/access-points
router.post("/:user_id/access-points", grantUserAccess);

// DELETE /users/:user_id/access-points
router.delete("/:user_id/access-points", revokeUserAccess);

export default router;

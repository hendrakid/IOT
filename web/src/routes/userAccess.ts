import { Router } from "express";
import { listUserAccessPoints, grantUserAccess, revokeUserAccess } from "../controllers/userAccessController";

const router = Router({ mergeParams: true });

// Mounted at /users/:user_id/access-points
router.get("/", listUserAccessPoints);

router.post("/", grantUserAccess);

router.delete("/", revokeUserAccess);

export default router;

import { Router } from "express";
import { listUsers, createUser, updateUser } from "../controllers/usersController";
import userAccessRouter from "./userAccess";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createUserSchema } from "../utils/schemas";

const router = Router();



router.get("/", requireAuth, listUsers);
router.post("/", requireAuth, validate(createUserSchema), createUser);
router.put("/:id", requireAuth, updateUser);

// Nested user access routes
router.use("/:user_id/access-points", userAccessRouter);

export default router;

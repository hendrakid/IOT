import { Router } from "express";
import { listUsers, createUser } from "../controllers/usersController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createUserSchema } from "../utils/schemas";

const router = Router();

router.get("/", requireAuth, listUsers);
router.post("/", requireAuth, validate(createUserSchema), createUser);

export default router;

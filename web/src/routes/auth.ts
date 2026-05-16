import { Router } from "express";
import { login } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { loginSchema } from "../utils/schemas";

const router = Router();

router.post("/login", validate(loginSchema), login);

export default router;

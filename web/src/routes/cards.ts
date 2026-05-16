import { Router } from "express";
import { listCards, createCard, deleteCard } from "../controllers/cardsController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createCardSchema } from "../utils/schemas";

const router = Router();

router.get("/", requireAuth, listCards);
router.post("/", requireAuth, validate(createCardSchema), createCard);
router.delete("/:id", requireAuth, deleteCard);

export default router;

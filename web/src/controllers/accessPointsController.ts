import { Request, Response } from "express";
import { getAllAccessPoints } from "../models/accessPoints";
import { pool } from "../models/db";
import { getAccessPointsByUser } from "../models/userAccessPoints";

export async function listAccessPoints(req: Request, res: Response) {
  const accessPoints = await getAllAccessPoints();
  res.json({ accessPoints });
}

export async function getCardAccessPoints(req: Request, res: Response) {
  const cardId = parseInt(req.params.cardId, 10);
  if (isNaN(cardId)) {
    return res.status(400).json({ error: "Invalid cardId" });
  }
  // Lookup user_id from card
  const { rows } = await pool.query("SELECT user_id FROM cards WHERE id = $1", [cardId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: "Card not found" });
  }
  const userId = rows[0].user_id;
  const accessPoints = await getAccessPointsByUser(userId);
  res.json({ accessPoints });
}

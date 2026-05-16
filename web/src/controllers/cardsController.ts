import { Request, Response, NextFunction } from "express";
import { pool } from "../models/db";

export async function listCards(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      `SELECT c.id, c.card_uid, c.label, c.created_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email
       FROM cards c
       JOIN users u ON u.id = c.user_id
       ORDER BY c.id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const { rows: countRows } = await pool.query("SELECT COUNT(*) FROM cards");
    const total = parseInt((countRows[0] as { count: string }).count, 10);

    res.json({ success: true, data: rows, meta: { page, limit, total } });
  } catch (err) {
    next(err);
  }
}

export async function createCard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { card_uid, label, user_id } = req.body as {
      card_uid: string;
      label: string;
      user_id: number;
    };

    // Verify user exists
    const { rows: userRows } = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [user_id]
    );
    if (userRows.length === 0) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO cards (card_uid, label, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, card_uid, label, user_id, created_at`,
      [card_uid, label, user_id]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ success: false, error: "Card UID already registered" });
      return;
    }
    next(err);
  }
}

export async function deleteCard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: "Invalid card ID" });
      return;
    }

    const { rowCount } = await pool.query("DELETE FROM cards WHERE id = $1", [id]);
    if (!rowCount || rowCount === 0) {
      res.status(404).json({ success: false, error: "Card not found" });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

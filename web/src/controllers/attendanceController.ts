import { Request, Response, NextFunction } from "express";
import { pool } from "../models/db";

export async function listAttendance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      `SELECT a.id, a.card_uid, a.action, a.timestamp,
              u.id AS user_id, u.name AS user_name
       FROM attendance a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.timestamp DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const { rows: countRows } = await pool.query("SELECT COUNT(*) FROM attendance");
    const total = parseInt((countRows[0] as { count: string }).count, 10);

    res.json({ success: true, data: rows, meta: { page, limit, total } });
  } catch (err) {
    next(err);
  }
}

export async function createAttendance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { card_uid, action } = req.body as { card_uid: string; action: string };

    // Look up user by card_uid
    const { rows: cardRows } = await pool.query(
      "SELECT user_id FROM cards WHERE card_uid = $1",
      [card_uid]
    );
    const user_id: number | null =
      cardRows.length > 0 ? (cardRows[0] as { user_id: number }).user_id : null;

    const resolvedAction =
      action !== "tap" ? action : cardRows.length > 0 ? "access_granted" : "access_denied";

    const { rows } = await pool.query(
      `INSERT INTO attendance (card_uid, user_id, action)
       VALUES ($1, $2, $3)
       RETURNING id, card_uid, user_id, action, timestamp`,
      [card_uid, user_id, resolvedAction]
    );

    res.status(201).json({
      success: true,
      data: rows[0],
      access: resolvedAction === "access_granted",
    });
  } catch (err) {
    next(err);
  }
}

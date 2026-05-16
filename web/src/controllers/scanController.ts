import { Request, Response, NextFunction } from "express";
import { pool } from "../models/db";
import { broadcastScan } from "../utils/scanBroadcast";

export async function handleScan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { uid } = req.body as { uid: string };

    // Check if card is registered; join users for the name
    const { rows: cardRows } = await pool.query<{
      user_id: number;
      user_name: string;
    }>(
      `SELECT c.user_id, u.name AS user_name
       FROM cards c
       JOIN users u ON u.id = c.user_id
       WHERE c.card_uid = $1`,
      [uid]
    );

    const registered = cardRows.length > 0;
    const user_id = registered ? cardRows[0].user_id : null;
    const user_name = registered ? cardRows[0].user_name : undefined;
    const access = registered;

    // Record attendance regardless of access result
    await pool.query(
      `INSERT INTO attendance (card_uid, user_id, action)
       VALUES ($1, $2, $3)`,
      [uid, user_id, registered ? "access_granted" : "access_denied"]
    );

    // Notify dashboard via SSE
    broadcastScan({ uid, registered, user_name });

    res.json({
      success: true,
      data: { uid, access, registered, ...(user_name ? { user_name } : {}) },
    });
  } catch (err) {
    next(err);
  }
}

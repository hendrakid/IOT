import { Request, Response, NextFunction } from "express";
import { pool } from "../models/db";
import { broadcastScan } from "../utils/scanBroadcast";
import { userHasAccess } from "../models/userAccessPoints";

export async function handleScan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Accept both direct scan (no access_point_id) and with access_point_id
    const { uid, access_point_id } = req.body as { uid: string; access_point_id?: number };

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

    let access = false;
    let checked = false;
    if (registered && access_point_id && user_id !== null) {
      access = await userHasAccess(user_id, access_point_id);
      checked = true;
    }
    // If no access_point_id, just report registration status

    // Record attendance regardless of access result
    await pool.query(
      `INSERT INTO attendance (card_uid, user_id, action, access_point_id)
       VALUES ($1, $2, $3, $4)`,
      [
        uid,
        user_id,
        checked ? (access ? "access_granted" : "access_denied") : "tap",
        access_point_id ?? null,
      ]
    );

    // Notify dashboard via SSE (always include access_point_id)
    broadcastScan({ uid, registered, user_name, access_point_id });

    res.json({
      success: true,
      data: { uid, access, registered, ...(user_name ? { user_name } : {}), checked },
    });
  } catch (err) {
    next(err);
  }
}

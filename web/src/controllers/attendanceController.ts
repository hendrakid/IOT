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

    const { from, to, action, search, access_point_id } = req.query as {
      from?: string;
      to?: string;
      action?: string;
      search?: string;
      access_point_id?: string;
    };

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (from) {
      conditions.push(`a.timestamp >= $${idx++}`);
      values.push(from);
    }
    if (to) {
      conditions.push(`a.timestamp <= $${idx++}`);
      values.push(to);
    }
    if (action && ["access_granted", "access_denied", "tap"].includes(action)) {
      conditions.push(`a.action = $${idx++}`);
      values.push(action);
    }
    if (access_point_id) {
      const apId = parseInt(access_point_id, 10);
      if (!Number.isNaN(apId) && apId > 0) {
        conditions.push(`a.access_point_id = $${idx++}`);
        values.push(apId);
      }
    }
    if (search) {
      conditions.push(`(a.card_uid ILIKE $${idx} OR u.name ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT a.id, a.card_uid, a.action, a.timestamp,
              a.access_point_id,
              u.id AS user_id, u.name AS user_name,
              ap.name AS access_point_name
       FROM attendance a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN access_points ap ON ap.id = a.access_point_id
       ${where}
       ORDER BY a.timestamp DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)
       FROM attendance a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN access_points ap ON ap.id = a.access_point_id
       ${where}`,
      values
    );
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
    const { card_uid, action, access_point_id } = req.body as {
      card_uid: string;
      action: string;
      access_point_id?: number;
    };

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
      `INSERT INTO attendance (card_uid, user_id, action, access_point_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, card_uid, user_id, action, access_point_id, timestamp`,
      [card_uid, user_id, resolvedAction, access_point_id ?? null]
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

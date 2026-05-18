import { Request, Response, NextFunction } from "express";
import { pool } from "../models/db";

export async function getStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [usersRes, cardsRes, successRateRes, unregisteredRes, recentRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM cards"),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE action = 'access_granted') AS granted,
           COUNT(*) AS total
         FROM attendance
         WHERE timestamp >= NOW() - INTERVAL '7 days'`
      ),
      pool.query(
        `SELECT COUNT(*) FROM attendance
         WHERE user_id IS NULL AND timestamp >= NOW() - INTERVAL '24 hours'`
      ),
      pool.query(
        `SELECT a.id, a.card_uid, a.action, a.timestamp,
                u.name AS user_name
         FROM attendance a
         LEFT JOIN users u ON u.id = a.user_id
         ORDER BY a.timestamp DESC
         LIMIT 8`
      ),
    ]);

    const totalUsers = parseInt((usersRes.rows[0] as { count: string }).count, 10);
    const totalCards = parseInt((cardsRes.rows[0] as { count: string }).count, 10);

    const { granted, total: totalScans } = successRateRes.rows[0] as {
      granted: string;
      total: string;
    };
    const successRate =
      parseInt(totalScans, 10) > 0
        ? Math.round((parseInt(granted, 10) / parseInt(totalScans, 10)) * 1000) / 10
        : 100;

    const unregisteredScans = parseInt(
      (unregisteredRes.rows[0] as { count: string }).count,
      10
    );

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCards,
        successRate,
        unregisteredScans,
        recentActivity: recentRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

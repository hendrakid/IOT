import { Request, Response, NextFunction } from "express";
import { pool } from "../models/db";
import { getAccessPointsByUser, userHasAccess, UserAccessPoint } from "../models/userAccessPoints";

export async function listUserAccessPoints(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user_id = parseInt(req.params.user_id, 10);
    if (isNaN(user_id)) {
      res.status(400).json({ success: false, error: "Invalid user ID" });
      return;
    }
    const accessPoints = await getAccessPointsByUser(user_id);
    res.json({ success: true, data: accessPoints });
  } catch (err) {
    next(err);
  }
}

export async function grantUserAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user_id = parseInt(req.params.user_id, 10);
    const { access_point_id } = req.body as { access_point_id: number };
    if (isNaN(user_id) || !access_point_id) {
      res.status(400).json({ success: false, error: "Invalid input" });
      return;
    }
    await pool.query(
      `INSERT INTO user_access_points (user_id, access_point_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [user_id, access_point_id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function revokeUserAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user_id = parseInt(req.params.user_id, 10);
    const { access_point_id } = req.body as { access_point_id: number };
    if (isNaN(user_id) || !access_point_id) {
      res.status(400).json({ success: false, error: "Invalid input" });
      return;
    }
    await pool.query(
      `DELETE FROM user_access_points WHERE user_id = $1 AND access_point_id = $2`,
      [user_id, access_point_id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

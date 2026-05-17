import { grantAccessPointsToUser } from "../models/userAccessPoints";
export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, error: "Invalid user id" });
      return;
    }
    const { name, email, role, access_point_ids } = req.body as {
      name?: string;
      email?: string;
      role?: string;
      access_point_ids?: number[];
    };

    // Update user info
    const fields = [];
    const values = [];
    let idx = 1;
    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (email) { fields.push(`email = $${idx++}`); values.push(email); }
    if (role) { fields.push(`role = $${idx++}`); values.push(role); }
    if (fields.length > 0) {
      values.push(userId);
      await pool.query(
        `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );
    }

    // Update access points if provided
    if (Array.isArray(access_point_ids)) {
      // Remove all current access points
      await pool.query("DELETE FROM user_access_points WHERE user_id = $1", [userId]);
      // Grant new ones
      if (access_point_ids.length > 0) {
        await grantAccessPointsToUser(userId, access_point_ids);
      }
    }

    // Return updated user
    const { rows } = await pool.query(
      `SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
      [userId]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}
import { Request, Response, NextFunction } from "express";
import { pool } from "../models/db";

export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY id DESC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, role, access_point_ids } = req.body as {
      name: string;
      email: string;
      role: string;
      access_point_ids?: number[];
    };

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, role)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, role]
    );

    const user = rows[0];

    // Grant access points if provided
    if (Array.isArray(access_point_ids) && access_point_ids.length > 0) {
      const { grantAccessPointsToUser } = await import("../models/userAccessPoints");
      await grantAccessPointsToUser(user.id, access_point_ids);
    }

    res.status(201).json({ success: true, data: user });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ success: false, error: "Email already registered" });
      return;
    }
    next(err);
  }
}

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
    const { name, email, role } = req.body as {
      name: string;
      email: string;
      role: string;
    };

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, role)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, role]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ success: false, error: "Email already registered" });
      return;
    }
    next(err);
  }
}

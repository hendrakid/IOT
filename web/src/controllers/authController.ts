import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../models/db";

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, password } = req.body as { username: string; password: string };

    const { rows } = await pool.query(
      "SELECT id, password FROM admins WHERE username = $1",
      [username]
    );

    if (rows.length === 0) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const admin = rows[0] as { id: number; password: string };
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign({ adminId: admin.id }, secret, { expiresIn: "8h" });

    res.json({ success: true, data: { token } });
  } catch (err) {
    next(err);
  }
}

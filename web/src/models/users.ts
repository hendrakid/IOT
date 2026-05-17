import { pool } from "./db";

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export async function getUserById(id: number): Promise<User | null> {
  const res = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function getAllUsers(): Promise<User[]> {
  const res = await pool.query(
    `SELECT * FROM users ORDER BY id ASC`
  );
  return res.rows;
}

import { pool } from "./db";

export type AccessPoint = {
  id: number;
  name: string;
  type: string;
  location?: string;
  created_at: string;
};

export async function getAllAccessPoints(): Promise<AccessPoint[]> {
  const res = await pool.query("SELECT * FROM access_points ORDER BY id ASC");
  return res.rows;
}

// Deprecated: getAccessPointsByCard
// Use getAccessPointsByUser from userAccessPoints.ts instead

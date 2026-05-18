export async function grantAccessPointsToUser(userId: number, accessPointIds: number[], grantedBy?: number) {
  if (!Array.isArray(accessPointIds) || accessPointIds.length === 0) return;
  const values = accessPointIds.map((apId, i) => `($1, $${i + 2}${grantedBy ? ", $" + (accessPointIds.length + 2) : ""})`).join(", ");
  const params = [userId, ...accessPointIds];
  if (grantedBy) params.push(grantedBy);
  const cols = grantedBy ? '(user_id, access_point_id, granted_by)' : '(user_id, access_point_id)';
  await pool.query(
    `INSERT INTO user_access_points ${cols} VALUES ${values} ON CONFLICT DO NOTHING`,
    params
  );
}
import { pool } from "./db";

export type UserAccessPoint = {
  id: number;
  user_id: number;
  access_point_id: number;
  granted_by?: number;
  granted_at: string;
};

export async function getAccessPointsByUser(userId: number) {
  const res = await pool.query(
    `SELECT ap.* FROM access_points ap
     JOIN user_access_points uap ON ap.id = uap.access_point_id
     WHERE uap.user_id = $1
     ORDER BY ap.id ASC`,
    [userId]
  );
  return res.rows;
}

export async function userHasAccess(userId: number, accessPointId: number): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM user_access_points WHERE user_id = $1 AND access_point_id = $2`,
    [userId, accessPointId]
  );
  return (res.rowCount ?? 0) > 0;
}

import { pool } from "./db";

export type Card = {
  id: number;
  card_uid: string;
  label: string;
  user_id: number;
  created_at: string;
};

export async function getCardByUID(card_uid: string): Promise<Card | null> {
  const res = await pool.query(
    `SELECT * FROM cards WHERE card_uid = $1`,
    [card_uid]
  );
  return res.rows[0] ?? null;
}

export async function getCardsByUser(user_id: number): Promise<Card[]> {
  const res = await pool.query(
    `SELECT * FROM cards WHERE user_id = $1 ORDER BY id ASC`,
    [user_id]
  );
  return res.rows;
}

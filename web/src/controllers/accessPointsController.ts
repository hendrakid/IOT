import { Request, Response, NextFunction } from "express";
import { getAccessPointStatusSnapshots } from "../models/accessPointStatus";
import { pool } from "../models/db";
import { getAccessPointsByUser } from "../models/userAccessPoints";

export async function listAccessPoints(_req: Request, res: Response, next: NextFunction) {
  try {
    const snapshots = await getAccessPointStatusSnapshots();
    const accessPoints = snapshots.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      location: s.location,
      created_at: s.created_at,
      status: s.status,
    }));
    res.json({ success: true, accessPoints });
  } catch (err) {
    next(err);
  }
}

export async function getCardAccessPoints(req: Request, res: Response, next: NextFunction) {
  try {
    const cardId = parseInt(req.params.cardId, 10);
    if (isNaN(cardId)) {
      res.status(400).json({ error: "Invalid cardId" });
      return;
    }
    const { rows } = await pool.query("SELECT user_id FROM cards WHERE id = $1", [cardId]);
    if (rows.length === 0) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    const userId = (rows[0] as { user_id: number }).user_id;
    const accessPoints = await getAccessPointsByUser(userId);
    res.json({ accessPoints });
  } catch (err) {
    next(err);
  }
}

export async function createAccessPoint(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, type, location } = req.body as {
      name: string;
      type: string;
      location?: string | null;
    };
    const { rows } = await pool.query(
      `INSERT INTO access_points (name, type, location)
       VALUES ($1, $2, $3)
       RETURNING id, name, type, location, created_at`,
      [name, type, location ?? null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateAccessPoint(req: Request, res: Response, next: NextFunction) {
  try {
    const apId = parseInt(req.params.id, 10);
    if (isNaN(apId)) {
      res.status(400).json({ success: false, error: "Invalid access point id" });
      return;
    }
    const { name, type, location } = req.body as {
      name?: string;
      type?: string;
      location?: string | null;
    };

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (type) { fields.push(`type = $${idx++}`); values.push(type); }
    if (location !== undefined) { fields.push(`location = $${idx++}`); values.push(location); }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: "No fields to update" });
      return;
    }

    values.push(apId);
    const { rows } = await pool.query(
      `UPDATE access_points SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, name, type, location, created_at`,
      values
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: "Access point not found" });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccessPoint(req: Request, res: Response, next: NextFunction) {
  try {
    const apId = parseInt(req.params.id, 10);
    if (isNaN(apId)) {
      res.status(400).json({ success: false, error: "Invalid access point id" });
      return;
    }
    const { rows } = await pool.query(
      "DELETE FROM access_points WHERE id = $1 RETURNING id",
      [apId]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: "Access point not found" });
      return;
    }
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

import { Response } from "express";

type SseClient = {
  res: Response;
  adminId: number;
  access_point_id?: number;
  include?: number[];
  exclude?: number[];
};

export type AttendanceAction = "access_granted" | "access_denied" | "tap";

export interface ScanEvent {
  uid: string;
  registered: boolean;
  user_name?: string;
  access_point_id?: number;
  action?: AttendanceAction;
  access_point_name?: string;
}

const clients: Set<SseClient> = new Set();

/** Register an SSE client (admin dashboard connection). */
export function addClient(client: SseClient): void {
  clients.add(client);
}

/** Remove an SSE client when the connection closes. */
export function removeClient(client: SseClient): void {
  clients.delete(client);
}

/** Broadcast a scan event to all connected admin dashboards. */
export function broadcastScan(event: ScanEvent): void {
  const eventAccessPointId = Number(event.access_point_id);
  if (!Number.isInteger(eventAccessPointId) || eventAccessPointId <= 0) {
    return;
  }

  const payload = JSON.stringify({ ...event, timestamp: new Date().toISOString() });
  for (const client of clients) {
    const clientAccessPointId = Number(client.access_point_id);
    if (!Number.isInteger(clientAccessPointId) || clientAccessPointId <= 0) continue;

    if (client.include && client.include.length > 0) {
      if (!client.include.includes(eventAccessPointId)) continue;
    } else if (client.exclude && client.exclude.length > 0) {
      if (client.exclude.includes(eventAccessPointId)) continue;
    } else if (clientAccessPointId !== eventAccessPointId) {
      continue;
    }

    client.res.write(`data: ${payload}\n\n`);
  }
}

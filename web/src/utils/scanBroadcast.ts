import { Response } from "express";

type SseClient = { res: Response; adminId: number };

export interface ScanEvent {
  uid: string;
  registered: boolean;
  user_name?: string;
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
  const payload = JSON.stringify({ ...event, timestamp: new Date().toISOString() });
  for (const client of clients) {
    client.res.write(`data: ${payload}\n\n`);
  }
}

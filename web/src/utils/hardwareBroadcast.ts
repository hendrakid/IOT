import { Response } from "express";

export type HardwareSseClient = {
  res: Response;
  adminId: number;
};

export type HardwareStatusEvent = {
  type: "snapshot" | "status";
  data: unknown;
  timestamp: string;
};

const clients: Set<HardwareSseClient> = new Set();

export function addHardwareClient(client: HardwareSseClient): void {
  clients.add(client);
}

export function removeHardwareClient(client: HardwareSseClient): void {
  clients.delete(client);
}

export function broadcastHardwareEvent(evt: Omit<HardwareStatusEvent, "timestamp">): void {
  const payload = JSON.stringify({ ...evt, timestamp: new Date().toISOString() });
  for (const client of clients) {
    client.res.write(`data: ${payload}\n\n`);
  }
}


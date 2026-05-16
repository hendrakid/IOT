import { broadcastScan, addClient, removeClient } from "../../src/utils/scanBroadcast";
import { Response } from "express";

function mockRes(): Response {
  return { write: jest.fn() } as unknown as Response;
}

describe("scanBroadcast", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("broadcasts event to all connected clients", () => {
    const res1 = mockRes();
    const res2 = mockRes();
    const c1 = { res: res1, adminId: 1 };
    const c2 = { res: res2, adminId: 2 };

    addClient(c1);
    addClient(c2);

    broadcastScan({ uid: "ABCD1234", registered: true, user_name: "Alice" });

    expect(res1.write).toHaveBeenCalledTimes(1);
    expect(res2.write).toHaveBeenCalledTimes(1);

    const payload = (res1.write as jest.Mock).mock.calls[0][0] as string;
    expect(payload).toContain("ABCD1234");
    expect(payload).toContain('"registered":true');
    expect(payload).toContain('"user_name":"Alice"');

    removeClient(c1);
    removeClient(c2);
  });

  it("broadcasts unregistered card event without user_name", () => {
    const res = mockRes();
    const client = { res, adminId: 1 };
    addClient(client);

    broadcastScan({ uid: "DEAD1234", registered: false });

    const payload = (res.write as jest.Mock).mock.calls[0][0] as string;
    expect(payload).toContain("DEAD1234");
    expect(payload).toContain('"registered":false');

    removeClient(client);
  });

  it("does not broadcast to removed clients", () => {
    const res = mockRes();
    const client = { res, adminId: 1 };

    addClient(client);
    removeClient(client);
    broadcastScan({ uid: "FFFF0000", registered: false });

    expect(res.write).not.toHaveBeenCalled();
  });

  it("includes timestamp in broadcast payload", () => {
    const res = mockRes();
    const client = { res, adminId: 1 };
    addClient(client);

    broadcastScan({ uid: "AABB1122", registered: true });

    const payload = (res.write as jest.Mock).mock.calls[0][0] as string;
    expect(payload).toContain("timestamp");

    removeClient(client);
  });
});

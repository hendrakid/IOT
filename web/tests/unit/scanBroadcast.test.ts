import { broadcastScan, addClient, removeClient } from "../../src/utils/scanBroadcast";
import { Response } from "express";

function mockRes(): Response {
  return { write: jest.fn() } as unknown as Response;
}

describe("scanBroadcast", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("broadcasts event to include-matched clients", () => {
    const res1 = mockRes();
    const res2 = mockRes();
    const c1 = { res: res1, adminId: 1, access_point_id: 1, include: [1] };
    const c2 = { res: res2, adminId: 2, access_point_id: 1, include: [2] };

    addClient(c1);
    addClient(c2);

    broadcastScan({ uid: "ABCD1234", registered: true, user_name: "Alice", access_point_id: 1 });

    expect(res1.write).toHaveBeenCalledTimes(1);
    expect(res2.write).not.toHaveBeenCalled();

    const payload = (res1.write as jest.Mock).mock.calls[0][0] as string;
    expect(payload).toContain("ABCD1234");
    expect(payload).toContain('"registered":true');
    expect(payload).toContain('"user_name":"Alice"');

    removeClient(c1);
    removeClient(c2);
  });

  it("broadcasts event to exclude-filtered clients when event is not excluded", () => {
    const res1 = mockRes();
    const res2 = mockRes();
    const c1 = { res: res1, adminId: 1, access_point_id: 1, exclude: [1] };
    const c2 = { res: res2, adminId: 2, access_point_id: 1, exclude: [2] };

    addClient(c1);
    addClient(c2);

    broadcastScan({ uid: "BEEF1234", registered: true, access_point_id: 2 });

    expect(res1.write).toHaveBeenCalledTimes(1);
    expect(res2.write).not.toHaveBeenCalled();

    removeClient(c1);
    removeClient(c2);
  });

  it("falls back to exact access_point_id match when include/exclude are absent", () => {
    const res1 = mockRes();
    const res2 = mockRes();
    const c1 = { res: res1, adminId: 1, access_point_id: 1 };
    const c2 = { res: res2, adminId: 2, access_point_id: 2 };

    addClient(c1);
    addClient(c2);

    broadcastScan({ uid: "F00D1234", registered: true, access_point_id: 1 });

    expect(res1.write).toHaveBeenCalledTimes(1);
    expect(res2.write).not.toHaveBeenCalled();

    removeClient(c1);
    removeClient(c2);
  });

  it("does not broadcast when client has no access_point_id", () => {
    const res = mockRes();
    const client = { res, adminId: 1 };
    addClient(client);

    broadcastScan({ uid: "DEAD1234", registered: false, access_point_id: 1 });

    expect(res.write).not.toHaveBeenCalled();

    removeClient(client);
  });

  it("does not broadcast when event has no access_point_id", () => {
    const res = mockRes();
    const client = { res, adminId: 1, access_point_id: 1 };

    addClient(client);
    broadcastScan({ uid: "FFFF0000", registered: false });

    expect(res.write).not.toHaveBeenCalled();

    removeClient(client);
  });

  it("does not broadcast to removed clients", () => {
    const res = mockRes();
    const client = { res, adminId: 1, access_point_id: 1 };

    addClient(client);
    removeClient(client);
    broadcastScan({ uid: "FFFF0000", registered: false, access_point_id: 1 });

    expect(res.write).not.toHaveBeenCalled();
  });

  it("includes timestamp in broadcast payload", () => {
    const res = mockRes();
    const client = { res, adminId: 1, access_point_id: 1 };
    addClient(client);

    broadcastScan({ uid: "AABB1122", registered: true, access_point_id: 1 });

    const payload = (res.write as jest.Mock).mock.calls[0][0] as string;
    expect(payload).toContain("timestamp");

    removeClient(client);
  });
});

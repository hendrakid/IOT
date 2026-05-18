import request from "supertest";
import app from "../../src/index";

describe("Scan logic (user-based access)", () => {
  it("denies access for unregistered card", async () => {
    const res = await request(app)
      .post("/api/scan")
      .send({ uid: "UNREGISTERED123", access_point_id: 1 });
    expect(res.body.success).toBe(true);
    expect(res.body.data.registered).toBe(false);
    expect(res.body.data.access).toBe(false);
    expect(res.body.data.checked).toBe(false);
  });

  it("returns checked=false when access_point_id is not provided", async () => {
    const res = await request(app)
      .post("/api/scan")
      .send({ uid: "UNREGISTERED456" });

    expect(res.body.success).toBe(true);
    expect(res.body.data.access).toBe(false);
    expect(res.body.data.checked).toBe(false);
  });
  // Add more tests for registered card, with/without access, etc.
});

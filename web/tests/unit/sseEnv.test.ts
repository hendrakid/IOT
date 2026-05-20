import { parsePositiveIntList, getSsePublicConfig } from "../../src/utils/sseEnv";

describe("sseEnv", () => {
  const originalEnv = process.env.SSE_REGISTRATION_ACCESS_POINT_IDS;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.SSE_REGISTRATION_ACCESS_POINT_IDS;
    } else {
      process.env.SSE_REGISTRATION_ACCESS_POINT_IDS = originalEnv;
    }
  });

  describe("parsePositiveIntList", () => {
    it("parses comma-separated ids", () => {
      expect(parsePositiveIntList("1, 2, 3", [99])).toEqual([1, 2, 3]);
    });

    it("returns fallback when empty", () => {
      expect(parsePositiveIntList("", [1])).toEqual([1]);
      expect(parsePositiveIntList(undefined, [1, 2])).toEqual([1, 2]);
    });

    it("ignores invalid tokens", () => {
      expect(parsePositiveIntList("1, x, -2, 0, 3", [99])).toEqual([1, 3]);
    });

    it("returns fallback when all tokens invalid", () => {
      expect(parsePositiveIntList("abc, -1", [1])).toEqual([1]);
    });
  });

  describe("getSsePublicConfig", () => {
    it("maps registration ids to include/exclude shapes", () => {
      process.env.SSE_REGISTRATION_ACCESS_POINT_IDS = "1,2";
      const cfg = getSsePublicConfig();

      expect(cfg.registrationAccessPointIds).toEqual([1, 2]);
      expect(cfg.userManagement.include).toEqual([1, 2]);
      expect(cfg.accessLogs.exclude).toEqual([1, 2]);
      expect(cfg.dashboard.exclude).toEqual([1, 2]);
      expect(cfg.accessPointId).toBe(1);
    });

    it("defaults to [1] when env unset", () => {
      delete process.env.SSE_REGISTRATION_ACCESS_POINT_IDS;
      const cfg = getSsePublicConfig();

      expect(cfg.registrationAccessPointIds).toEqual([1]);
      expect(cfg.accessPointId).toBe(1);
    });
  });
});

import { createCardSchema, createUserSchema, loginSchema, scanSchema } from "../../src/utils/schemas";

describe("Zod schemas", () => {
  describe("loginSchema", () => {
    it("passes with valid input", () => {
      expect(() => loginSchema.parse({ username: "admin", password: "pass" })).not.toThrow();
    });
    it("fails with empty username", () => {
      expect(() => loginSchema.parse({ username: "", password: "pass" })).toThrow();
    });
  });

  describe("createCardSchema", () => {
    it("uppercases card_uid", () => {
      const result = createCardSchema.parse({ card_uid: "abcd1234", label: "test", user_id: 1 });
      expect(result.card_uid).toBe("ABCD1234");
    });

    it("strips spaces from card_uid", () => {
      const result = createCardSchema.parse({ card_uid: "AB CD 12 34", label: "", user_id: 1 });
      expect(result.card_uid).toBe("ABCD1234");
    });

    it("fails if user_id is not a positive integer", () => {
      expect(() => createCardSchema.parse({ card_uid: "ABCD", label: "", user_id: -1 })).toThrow();
    });

    it("defaults label to empty string", () => {
      const result = createCardSchema.parse({ card_uid: "ABCD", user_id: 1 });
      expect(result.label).toBe("");
    });
  });

  describe("createUserSchema", () => {
    it("passes with valid input", () => {
      expect(() =>
        createUserSchema.parse({ name: "Budi", email: "budi@example.com" })
      ).not.toThrow();
    });

    it("rejects invalid email", () => {
      expect(() =>
        createUserSchema.parse({ name: "Budi", email: "not-an-email" })
      ).toThrow();
    });

    it("defaults role to member", () => {
      const result = createUserSchema.parse({ name: "A", email: "a@b.com" });
      expect(result.role).toBe("member");
    });
  });

  describe("scanSchema", () => {
    it("uppercases uid", () => {
      const result = scanSchema.parse({ uid: "abcdef" });
      expect(result.uid).toBe("ABCDEF");
    });
  });
});

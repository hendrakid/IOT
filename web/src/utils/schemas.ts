import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(150),
  role: z.string().min(1).max(50).optional().default("member"),
  access_point_ids: z.array(z.number().int().positive()).optional().default([]),
});

export const createCardSchema = z.object({
  card_uid: z
    .string()
    .min(1)
    .max(50)
    .transform((v) => v.toUpperCase().replace(/\s/g, "")),
  label: z.string().max(100).optional().default(""),
  user_id: z.number().int().positive(),
});

export const scanSchema = z.object({
  uid: z
    .string()
    .min(1)
    .max(50)
    .transform((v) => v.toUpperCase().replace(/\s/g, "")),
  access_point_id: z.number().int().positive().optional(),
});

export const createAttendanceSchema = z.object({
  card_uid: z
    .string()
    .min(1)
    .max(50)
    .transform((v) => v.toUpperCase().replace(/\s/g, "")),
  action: z.enum(["tap", "access_granted", "access_denied"]).optional().default("tap"),
  access_point_id: z.number().int().positive().optional(),
});

export const accessPointTypeSchema = z.enum([
  "door",
  "gate",
  "lift",
  "server_room",
  "other",
]);

export const createAccessPointSchema = z.object({
  name: z.string().min(1).max(100),
  type: accessPointTypeSchema,
  location: z
    .string()
    .max(150)
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      const trimmed = v.trim();
      return trimmed.length ? trimmed : null;
    }),
});

export const updateAccessPointSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    type: accessPointTypeSchema.optional(),
    location: z
      .string()
      .max(150)
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        const trimmed = v.trim();
        return trimmed.length ? trimmed : null;
      }),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "No fields to update",
  });

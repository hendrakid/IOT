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
});

export const createAttendanceSchema = z.object({
  card_uid: z
    .string()
    .min(1)
    .max(50)
    .transform((v) => v.toUpperCase().replace(/\s/g, "")),
  action: z.enum(["tap", "access_granted", "access_denied"]).optional().default("tap"),
});

import { z } from "zod";

export const authSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(30, "Keep it under 30 characters")
    .regex(/[a-z0-9]/i, "Use at least one letter or number"),
  password: z.string().min(6, "At least 6 characters"),
});

export type AuthInput = z.infer<typeof authSchema>;

import { z } from "zod";

/**
 * Example entity schema — one Zod schema per entity, shared by React Hook Form,
 * the mutation service, and inferred types (docs/05-data-flow.md). This sets the
 * pattern the rest of the schemas follow.
 */
export const setTypeEnum = z.enum([
  "normal",
  "warmup",
  "drop",
  "failure",
  "partial",
  "paused",
]);

export const logSetSchema = z.object({
  weightKg: z.number().nonnegative().max(1000).nullable(),
  reps: z.number().int().min(0).max(1000).nullable(),
  rpe: z.number().min(0).max(10).nullable(),
  restSeconds: z.number().int().min(0).nullable(),
  tempo: z.string().max(20).nullable(),
  setType: setTypeEnum.default("normal"),
  isCompleted: z.boolean().default(false),
  notes: z.string().max(500).nullable(),
});

export type LogSetInput = z.infer<typeof logSetSchema>;

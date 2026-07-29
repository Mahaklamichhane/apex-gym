import { z } from "zod";

/**
 * Validated environment variables — fail fast on boot if misconfigured.
 * Only NEXT_PUBLIC_* vars belong here (they're inlined into the client bundle).
 * Server-only secrets (service role key) must NEVER live in a NEXT_PUBLIC_ var.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `❌ Invalid environment variables. Check your .env.local:\n${issues}`,
  );
}

export const env = parsed.data;

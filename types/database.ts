/**
 * ⚠️ PLACEHOLDER — regenerate from the live Supabase schema.
 *
 * Once you've run `supabase login` (with a personal access token from
 * https://supabase.com/dashboard/account/tokens), generate the real types:
 *
 *   supabase gen types typescript --project-id <your-project-ref> > types/database.ts
 *
 * (Your project ref is in the dashboard URL: /project/<ref>.)
 * That replaces this file with fully-typed tables/rows/enums, and every
 * Supabase query becomes end-to-end type-safe. Until then this permissive
 * stub keeps the app compiling.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

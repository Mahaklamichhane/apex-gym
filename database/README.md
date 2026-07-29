# Apex Gym — Database

Runnable PostgreSQL for Supabase. Files run **in order**.

```
migrations/
  0001_schema.sql      types · tables · indexes · views
  0002_functions.sql   updated_at · e1rm · PR detection · session finalize · new-user profile
  0003_rls.sql         Row Level Security on every table
seed/
  0001_reference.sql   muscle groups · equipment · ~26 global exercises · achievements
```

## Run it

**Option A — Supabase CLI (recommended):**
```bash
supabase init                 # once
supabase db reset             # applies everything in supabase/migrations
# copy these files into supabase/migrations/ (keep the numeric prefixes) and seed/ into supabase/seed.sql
```

**Option B — SQL editor / psql (quick start):**
```bash
psql "$DATABASE_URL" -f migrations/0001_schema.sql
psql "$DATABASE_URL" -f migrations/0002_functions.sql
psql "$DATABASE_URL" -f migrations/0003_rls.sql
psql "$DATABASE_URL" -f seed/0001_reference.sql
```

## Design notes worth knowing
- **RLS is on for every table.** Global reference data (muscle_groups, equipment, global
  exercises, achievements) is read-only to authenticated users; everything user-owned is
  isolated by `auth.uid()`.
- **`muscle_volume_7d` is `security_invoker`** so it respects the caller's RLS — a plain
  view would run as owner and leak other users' data.
- **`sets.user_id` is intentionally denormalized** (the hottest table) so RLS and analytics
  don't join three tables on every query.
- **Derived data is computed by triggers**, not trusted from the client: `est_1rm_kg`
  (Epley), session `duration_seconds` / `total_volume_kg`, and PR detection all fire in
  the database on session finalize — consistent even if a write bypasses the app.
- **A profile row is auto-created** on signup via a trigger on `auth.users`.
- **Regenerate types after any change:**
  `supabase gen types typescript --local > types/database.ts`

## Verify (smoke test)
After seeding, as an authenticated user:
```sql
select count(*) from muscle_groups;   -- 18
select count(*) from equipment;       -- 9
select count(*) from exercises where owner_id is null;  -- 26
select name from exercises e
  join exercise_muscles em on em.exercise_id = e.id
  join muscle_groups mg on mg.id = em.muscle_group_id
  where mg.slug = 'chest' and em.is_primary;            -- Bench, Incline DB, Cable Fly
```

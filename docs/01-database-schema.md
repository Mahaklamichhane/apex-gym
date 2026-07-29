# Apex Gym — Database Schema

PostgreSQL (Supabase). Multi-user from day one via RLS. All timestamps `timestamptz`.
All PKs `uuid default gen_random_uuid()`. All user-owned tables carry `user_id uuid`
referencing `auth.users(id)`.

Conventions:
- `created_at timestamptz not null default now()`, `updated_at` maintained by a trigger.
- Soft-delete via `archived_at timestamptz` where the spec asks for "archive".
- Enums as Postgres `enum` types where values are stable; `text` + check where they may grow.
- Money/measurement units are **stored canonical** (kg, cm, ml, kcal). Display converts.

---

## 1. Enums (stable vocabularies)

```sql
create type unit_system      as enum ('metric', 'imperial');
create type theme_pref       as enum ('system', 'dark', 'light');
create type sex_type         as enum ('male', 'female', 'other', 'prefer_not_to_say');
create type experience_level as enum ('beginner', 'intermediate', 'advanced');
create type activity_level   as enum ('sedentary','light','moderate','active','very_active');
create type training_goal    as enum ('strength','hypertrophy','endurance','fat_loss','general');
create type difficulty       as enum ('beginner','intermediate','advanced');
create type template_category as enum ('push','pull','legs','upper','lower','full_body','custom');
create type session_status   as enum ('active','completed','abandoned');
create type set_type         as enum ('normal','warmup','drop','failure','partial','paused');
create type measurement_source as enum ('manual','apple_health','google_fit','garmin','whoop','fitbit');
create type pr_type          as enum ('max_weight','max_volume','est_1rm','max_reps','longest_set');
create type goal_status      as enum ('active','achieved','missed','archived');
```

---

## 2. Reference tables (global, read-only to users)

These are shared, not user-owned. RLS: **select** to all authenticated; writes only via
service role / migrations.

```sql
-- Canonical muscle list, grouped for the heatmap.
create table muscle_groups (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,          -- 'chest', 'lats', 'quads'
  name        text not null,
  region      text not null,                 -- 'upper','core','lower' — for heatmap layout
  svg_id      text not null                  -- maps to the body-map SVG path id
);

create table equipment (
  id    uuid primary key default gen_random_uuid(),
  slug  text not null unique,                -- 'barbell','dumbbell','cable','bodyweight'
  name  text not null
);
```

### Exercises — global library + user custom in one table

Single table. `owner_id NULL` = system/global exercise; non-null = a user's custom one.
This avoids a duplicate "custom_exercises" table and lets templates reference either uniformly.

```sql
create table exercises (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete cascade,  -- NULL = global
  name          text not null,
  description   text,
  instructions  text,                          -- markdown, step-by-step
  equipment_id  uuid references equipment(id),
  difficulty    difficulty not null default 'intermediate',
  video_url     text,
  gif_url       text,
  common_mistakes text[],                       -- short bullet strings
  tips          text[],
  tags          text[] not null default '{}',
  is_unilateral boolean not null default false, -- affects volume math (L/R)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on exercises (owner_id);
create index on exercises using gin (tags);
create index on exercises using gin (to_tsvector('english', name || ' ' || coalesce(description,'')));

-- Muscle involvement (primary/secondary) — normalized many-to-many.
create table exercise_muscles (
  exercise_id     uuid not null references exercises(id) on delete cascade,
  muscle_group_id uuid not null references muscle_groups(id) on delete restrict,
  is_primary      boolean not null,             -- true=primary, false=secondary
  primary key (exercise_id, muscle_group_id)
);
create index on exercise_muscles (muscle_group_id);

-- "Alternatives" — self-referential graph, user-agnostic suggestions.
create table exercise_alternatives (
  exercise_id     uuid not null references exercises(id) on delete cascade,
  alternative_id  uuid not null references exercises(id) on delete cascade,
  primary key (exercise_id, alternative_id),
  check (exercise_id <> alternative_id)
);

-- Per-user favorite / notes on an exercise (keeps exercises table clean).
create table user_exercise_meta (
  user_id      uuid not null references auth.users(id) on delete cascade,
  exercise_id  uuid not null references exercises(id) on delete cascade,
  is_favorite  boolean not null default false,
  notes        text,
  updated_at   timestamptz not null default now(),
  primary key (user_id, exercise_id)
);
```

---

## 3. Profile

```sql
create table profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text,
  sex               sex_type,
  birthdate         date,                        -- store DOB, derive age (never store age)
  height_cm         numeric(5,1),
  experience_level  experience_level default 'beginner',
  activity_level    activity_level   default 'moderate',
  training_goal     training_goal    default 'general',
  gym_location      text,
  unit_system       unit_system      not null default 'metric',
  theme             theme_pref       not null default 'system',
  available_equipment uuid[] not null default '{}',  -- equipment ids the user owns
  -- daily targets (canonical units)
  target_calories   integer,
  protein_goal_g    integer,
  water_goal_ml     integer,
  steps_goal        integer,
  notifications     jsonb not null default '{}',    -- flexible pref bag
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
```
> Note: `weight` is **not** on the profile — it's time-series data in `body_measurements`.
> Storing it here would fight the body tracker. "Current weight" = latest measurement.

---

## 4. Templates (the plan)

```sql
create table workout_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  category    template_category not null default 'custom',
  notes       text,
  is_favorite boolean not null default false,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on workout_templates (user_id) where archived_at is null;

create table template_exercises (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references workout_templates(id) on delete cascade,
  exercise_id  uuid not null references exercises(id) on delete restrict,
  position     integer not null,               -- ordering
  superset_group smallint,                      -- same number = supersetted
  notes        text,
  unique (template_id, position)
);
create index on template_exercises (template_id);

-- Target sets per exercise in a template (the prescription).
create table template_sets (
  id                   uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references template_exercises(id) on delete cascade,
  position             integer not null,
  target_reps          integer,
  target_weight_kg     numeric(6,2),
  target_rpe           numeric(3,1),
  rest_seconds         integer,
  set_type             set_type not null default 'normal',
  unique (template_exercise_id, position)
);
```

---

## 5. Sessions (the reality — what you actually did)

```sql
create table workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  template_id   uuid references workout_templates(id) on delete set null, -- may be ad-hoc
  name          text,
  status        session_status not null default 'active',
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  duration_seconds integer,                     -- denormalized on finish for fast reads
  total_volume_kg  numeric(10,2),               -- denormalized on finish
  notes         text,
  mood          smallint check (mood between 1 and 5),
  created_at    timestamptz not null default now()
);
create index on workout_sessions (user_id, started_at desc);
create index on workout_sessions (user_id) where status = 'active';  -- fast "resume" lookup

create table session_exercises (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references workout_sessions(id) on delete cascade,
  exercise_id  uuid not null references exercises(id) on delete restrict,
  position     integer not null,
  superset_group smallint,
  notes        text,
  unique (session_id, position)
);
create index on session_exercises (session_id);
create index on session_exercises (exercise_id);   -- for per-exercise history queries

-- The atomic unit of the whole app: one logged set.
create table sets (
  id                  uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references session_exercises(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade, -- denormalized for RLS + analytics
  position            integer not null,
  weight_kg           numeric(6,2),
  reps                integer,
  rpe                 numeric(3,1),
  rest_seconds        integer,
  tempo               text,                      -- '3-1-1-0'
  set_type            set_type not null default 'normal',
  is_completed        boolean not null default false,
  completed_at        timestamptz,
  notes               text,
  est_1rm_kg          numeric(6,2),              -- computed on write (Epley) for cheap PR/analytics
  unique (session_exercise_id, position)
);
create index on sets (user_id, completed_at desc);
create index on sets (session_exercise_id);
```
> **Why `user_id` is denormalized onto `sets`:** RLS and analytics both need to filter
> sets by user without a 3-table join on every query. This is a deliberate, indexed
> denormalization — the single highest-traffic table in the app.

---

## 6. Personal Records

Stored (not just computed) so PR history + "PR achieved!" notifications are cheap and
the timeline is queryable.

```sql
create table personal_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  exercise_id  uuid not null references exercises(id) on delete cascade,
  pr_type      pr_type not null,
  value        numeric(10,2) not null,          -- kg, reps, or seconds by type
  set_id       uuid references sets(id) on delete set null,   -- the set that set it
  session_id   uuid references workout_sessions(id) on delete set null,
  achieved_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index on personal_records (user_id, exercise_id, pr_type, achieved_at desc);
```
> PR detection runs in a service on session-finish (or a Postgres trigger), comparing new
> sets against the current best per (exercise, pr_type). Volume/Workout/Weekly/Monthly/
> Lifetime PRs are *aggregations* of this table + sessions, not separate storage.

---

## 7. Body tracking, photos

```sql
create table body_measurements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  measured_at date not null,
  source      measurement_source not null default 'manual',
  external_id text,                              -- for future device sync dedupe
  weight_kg      numeric(5,2),
  body_fat_pct   numeric(4,1),
  -- circumferences (cm), all nullable — log what you measure
  neck_cm numeric(4,1), shoulders_cm numeric(4,1), chest_cm numeric(4,1),
  waist_cm numeric(4,1), hip_cm numeric(4,1),
  left_arm_cm numeric(4,1), right_arm_cm numeric(4,1),
  left_forearm_cm numeric(4,1), right_forearm_cm numeric(4,1),
  left_thigh_cm numeric(4,1), right_thigh_cm numeric(4,1),
  left_calf_cm numeric(4,1), right_calf_cm numeric(4,1),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, measured_at, source)
);
create index on body_measurements (user_id, measured_at desc);
-- BMI is derived (weight/height²), never stored.

create table progress_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  taken_at    date not null,
  pose        text not null,                    -- 'front','side','back','relaxed','flexed'
  storage_path text not null,                   -- Supabase Storage object path
  tags        text[] not null default '{}',
  notes       text,
  created_at  timestamptz not null default now()
);
create index on progress_photos (user_id, taken_at desc);
```

---

## 8. Nutrition & Recovery (manual, source-tagged for future sync)

```sql
create table nutrition_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_date   date not null,
  calories   integer,
  protein_g  integer,
  carbs_g    integer,
  fat_g      integer,
  fiber_g    integer,
  sugar_g    integer,
  water_ml   integer,
  notes      text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)                    -- one row per day (daily totals)
);
create index on nutrition_logs (user_id, log_date desc);

create table recovery_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  log_date       date not null,
  source         measurement_source not null default 'manual',
  sleep_hours    numeric(4,2),
  sleep_quality  smallint check (sleep_quality between 1 and 5),
  stress         smallint check (stress between 1 and 5),
  mood           smallint check (mood between 1 and 5),
  energy         smallint check (energy between 1 and 5),
  soreness       smallint check (soreness between 1 and 5),
  readiness_score smallint,                      -- computed 0-100 by coach service
  notes          text,
  created_at     timestamptz not null default now(),
  unique (user_id, log_date, source)
);
create index on recovery_logs (user_id, log_date desc);
```

---

## 9. Goals, Achievements, Notes/Journal

```sql
create table goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  metric        text not null,                  -- 'bench_1rm','bodyweight','streak','protein'...
  exercise_id   uuid references exercises(id) on delete set null,  -- for lift goals
  target_value  numeric(10,2) not null,
  start_value   numeric(10,2),
  current_value numeric(10,2),                   -- refreshed by service
  unit          text,
  deadline      date,
  status        goal_status not null default 'active',
  achieved_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index on goals (user_id, status);

-- Achievement DEFINITIONS are global reference data.
create table achievements (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,             -- 'first_workout','100_workouts','bench_100kg'
  name        text not null,
  description text not null,
  icon        text,
  criteria    jsonb not null                    -- machine-checkable rule
);

-- What THIS user has unlocked.
create table user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  body       text not null,
  is_pinned  boolean not null default false,
  -- optional attachment to any entity, kept generic:
  entity_type text,                             -- 'exercise','session','day', null=standalone
  entity_id   uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on notes (user_id) where is_pinned;

create table daily_journal (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  body       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);
```

---

## 10. Muscle recovery — a *view*, not a table

Don't store recovery state (it's stale the moment it's written). Compute it on read from
sets landed per muscle × recency × RPE. Materialize later only if perf demands it.

```sql
-- Sets landed on each muscle over a window, weighted primary=1.0 / secondary=0.5.
create view muscle_volume_7d as
select s.user_id,
       em.muscle_group_id,
       sum(case when em.is_primary then 1 else 0.5 end) as weighted_sets,
       max(s.completed_at) as last_trained_at
from sets s
join session_exercises se on se.id = s.session_exercise_id
join exercise_muscles em  on em.exercise_id = se.exercise_id
where s.is_completed
  and s.completed_at > now() - interval '7 days'
group by s.user_id, em.muscle_group_id;
```
Recovery status (`recovered|fresh|fatigued|overtrained`) is derived in
`services/coach/recovery.ts` from `weighted_sets`, `last_trained_at`, and recent
`recovery_logs.soreness`. Transparent and tunable — see coach service.

---

## 11. Triggers

- `set_updated_at()` — generic `before update` trigger on every table with `updated_at`.
- `sets_compute_e1rm()` — `before insert/update` on `sets`: sets `est_1rm_kg = weight_kg * (1 + reps/30.0)` (Epley) when both present.
- `session_finalize()` — on session `status → 'completed'`: compute `duration_seconds`,
  `total_volume_kg`, run PR detection, run achievement checks. (Can also live in the
  service layer; a trigger guarantees consistency even if a write bypasses the app.)

---

## 12. Row Level Security — the pattern

Enable RLS on **every** table. Two patterns only:

**Pattern A — user-owned tables** (profiles, templates, sessions, sets, goals, …):
```sql
alter table workout_sessions enable row level security;

create policy "own rows: select" on workout_sessions
  for select using (auth.uid() = user_id);
create policy "own rows: insert" on workout_sessions
  for insert with check (auth.uid() = user_id);
create policy "own rows: update" on workout_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows: delete" on workout_sessions
  for delete using (auth.uid() = user_id);
```
Child tables without a direct `user_id` (e.g. `template_sets`, `session_exercises`) either
carry a denormalized `user_id` (like `sets`) **or** check ownership via the parent:
```sql
create policy "via parent" on template_sets for all using (
  exists (
    select 1 from template_exercises te
    join workout_templates t on t.id = te.template_id
    where te.id = template_sets.template_exercise_id and t.user_id = auth.uid()
  )
);
```
> Prefer denormalized `user_id` on hot tables (`sets`) for RLS performance; use the parent
> `exists` check on cold ones.

**Pattern B — global reference tables** (exercises[global], muscle_groups, equipment,
achievements):
```sql
alter table muscle_groups enable row level security;
create policy "read all" on muscle_groups for select using (auth.role() = 'authenticated');
-- no insert/update/delete policy => only service_role (migrations) can write.
```

**Exercises (mixed)** — global rows readable by all, custom rows private:
```sql
create policy "read global or own" on exercises for select
  using (owner_id is null or owner_id = auth.uid());
create policy "write own only" on exercises for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
```

---

## 13. Relationship map (text ERD)

```
auth.users 1──1 profiles
auth.users 1──∞ exercises (custom)          exercises ∞──∞ muscle_groups  (exercise_muscles)
auth.users 1──∞ workout_templates           exercises ∞──∞ equipment      (via equipment_id)
   workout_templates 1──∞ template_exercises 1──∞ template_sets
auth.users 1──∞ workout_sessions            exercises 1──∞ exercise_alternatives (self)
   workout_sessions 1──∞ session_exercises 1──∞ sets
   sets ∞──1 exercises (via session_exercises)
auth.users 1──∞ personal_records ∞──1 exercises
auth.users 1──∞ body_measurements | progress_photos | nutrition_logs | recovery_logs
auth.users 1──∞ goals ∞──1 exercises(opt)
auth.users ∞──∞ achievements (user_achievements)
auth.users 1──∞ notes | daily_journal
```

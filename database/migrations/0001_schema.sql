-- ============================================================================
-- Apex Gym — 0001 schema
-- Types, tables, indexes, views. Run first.
-- Idempotent-ish: safe on a fresh Supabase project.
-- ============================================================================

create extension if not exists pgcrypto;      -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
create type unit_system        as enum ('metric', 'imperial');
create type theme_pref         as enum ('system', 'dark', 'light');
create type sex_type           as enum ('male', 'female', 'other', 'prefer_not_to_say');
create type experience_level   as enum ('beginner', 'intermediate', 'advanced');
create type activity_level     as enum ('sedentary','light','moderate','active','very_active');
create type training_goal      as enum ('strength','hypertrophy','endurance','fat_loss','general');
create type difficulty         as enum ('beginner','intermediate','advanced');
create type template_category  as enum ('push','pull','legs','upper','lower','full_body','custom');
create type session_status     as enum ('active','completed','abandoned');
create type set_type           as enum ('normal','warmup','drop','failure','partial','paused');
create type measurement_source as enum ('manual','apple_health','google_fit','garmin','whoop','fitbit');
create type pr_type            as enum ('max_weight','max_volume','est_1rm','max_reps','longest_set');
create type goal_status        as enum ('active','achieved','missed','archived');

-- ---------------------------------------------------------------------------
-- 2. Reference tables (global; RLS = read to authenticated, write via service role)
-- ---------------------------------------------------------------------------
create table muscle_groups (
  id     uuid primary key default gen_random_uuid(),
  slug   text not null unique,
  name   text not null,
  region text not null,                         -- 'upper' | 'core' | 'lower'
  svg_id text not null
);

create table equipment (
  id   uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table exercises (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users(id) on delete cascade,  -- NULL = global
  name            text not null,
  description     text,
  instructions    text,
  equipment_id    uuid references equipment(id),
  difficulty      difficulty not null default 'intermediate',
  video_url       text,
  gif_url         text,
  common_mistakes text[] not null default '{}',
  tips            text[] not null default '{}',
  tags            text[] not null default '{}',
  is_unilateral   boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index exercises_owner_idx  on exercises (owner_id);
create index exercises_tags_idx   on exercises using gin (tags);
create index exercises_search_idx on exercises
  using gin (to_tsvector('english', name || ' ' || coalesce(description, '')));

create table exercise_muscles (
  exercise_id     uuid not null references exercises(id) on delete cascade,
  muscle_group_id uuid not null references muscle_groups(id) on delete restrict,
  is_primary      boolean not null,
  primary key (exercise_id, muscle_group_id)
);
create index exercise_muscles_muscle_idx on exercise_muscles (muscle_group_id);

create table exercise_alternatives (
  exercise_id    uuid not null references exercises(id) on delete cascade,
  alternative_id uuid not null references exercises(id) on delete cascade,
  primary key (exercise_id, alternative_id),
  check (exercise_id <> alternative_id)
);

create table user_exercise_meta (
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  is_favorite boolean not null default false,
  notes       text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

-- ---------------------------------------------------------------------------
-- 3. Profile (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text,
  sex                 sex_type,
  birthdate           date,                     -- store DOB; derive age
  height_cm           numeric(5,1),
  experience_level    experience_level not null default 'beginner',
  activity_level      activity_level   not null default 'moderate',
  training_goal       training_goal    not null default 'general',
  gym_location        text,
  unit_system         unit_system      not null default 'metric',
  theme               theme_pref       not null default 'system',
  available_equipment uuid[]           not null default '{}',
  target_calories     integer,
  protein_goal_g      integer,
  water_goal_ml       integer,
  steps_goal          integer,
  notifications       jsonb            not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Templates (the plan)
-- ---------------------------------------------------------------------------
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
create index workout_templates_user_idx on workout_templates (user_id) where archived_at is null;

create table template_exercises (
  id             uuid primary key default gen_random_uuid(),
  template_id    uuid not null references workout_templates(id) on delete cascade,
  exercise_id    uuid not null references exercises(id) on delete restrict,
  position       integer not null,
  superset_group smallint,
  notes          text,
  unique (template_id, position) deferrable initially deferred
);
create index template_exercises_template_idx on template_exercises (template_id);

create table template_sets (
  id                   uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references template_exercises(id) on delete cascade,
  position             integer not null,
  target_reps          integer,
  target_weight_kg     numeric(6,2),
  target_rpe           numeric(3,1),
  rest_seconds         integer,
  set_type             set_type not null default 'normal',
  unique (template_exercise_id, position) deferrable initially deferred
);

-- ---------------------------------------------------------------------------
-- 5. Sessions (the reality)
-- ---------------------------------------------------------------------------
create table workout_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  template_id      uuid references workout_templates(id) on delete set null,
  name             text,
  status           session_status not null default 'active',
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_seconds integer,
  total_volume_kg  numeric(10,2),
  notes            text,
  mood             smallint check (mood between 1 and 5),
  created_at       timestamptz not null default now()
);
create index workout_sessions_user_idx   on workout_sessions (user_id, started_at desc);
create index workout_sessions_active_idx on workout_sessions (user_id) where status = 'active';

create table session_exercises (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references workout_sessions(id) on delete cascade,
  exercise_id    uuid not null references exercises(id) on delete restrict,
  position       integer not null,
  superset_group smallint,
  notes          text,
  unique (session_id, position) deferrable initially deferred
);
create index session_exercises_session_idx  on session_exercises (session_id);
create index session_exercises_exercise_idx on session_exercises (exercise_id);

create table sets (
  id                  uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references session_exercises(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade, -- denormalized: RLS + analytics
  position            integer not null,
  weight_kg           numeric(6,2),
  reps                integer,
  rpe                 numeric(3,1),
  rest_seconds        integer,
  tempo               text,
  set_type            set_type not null default 'normal',
  is_completed        boolean not null default false,
  completed_at        timestamptz,
  notes               text,
  est_1rm_kg          numeric(6,2),             -- computed by trigger (Epley)
  unique (session_exercise_id, position) deferrable initially deferred
);
create index sets_user_idx    on sets (user_id, completed_at desc);
create index sets_sessex_idx  on sets (session_exercise_id);

-- ---------------------------------------------------------------------------
-- 6. Personal records
-- ---------------------------------------------------------------------------
create table personal_records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  pr_type     pr_type not null,
  value       numeric(10,2) not null,
  set_id      uuid references sets(id) on delete set null,
  session_id  uuid references workout_sessions(id) on delete set null,
  achieved_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index personal_records_lookup_idx
  on personal_records (user_id, exercise_id, pr_type, achieved_at desc);

-- ---------------------------------------------------------------------------
-- 7. Body / photos / nutrition / recovery
-- ---------------------------------------------------------------------------
create table body_measurements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  measured_at     date not null,
  source          measurement_source not null default 'manual',
  external_id     text,
  weight_kg       numeric(5,2),
  body_fat_pct    numeric(4,1),
  neck_cm         numeric(4,1), shoulders_cm numeric(4,1), chest_cm numeric(4,1),
  waist_cm        numeric(4,1), hip_cm       numeric(4,1),
  left_arm_cm     numeric(4,1), right_arm_cm numeric(4,1),
  left_forearm_cm numeric(4,1), right_forearm_cm numeric(4,1),
  left_thigh_cm   numeric(4,1), right_thigh_cm numeric(4,1),
  left_calf_cm    numeric(4,1), right_calf_cm  numeric(4,1),
  notes           text,
  created_at      timestamptz not null default now(),
  unique (user_id, measured_at, source)
);
create index body_measurements_user_idx on body_measurements (user_id, measured_at desc);

create table progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  taken_at     date not null,
  pose         text not null,                   -- front|side|back|relaxed|flexed
  storage_path text not null,
  tags         text[] not null default '{}',
  notes        text,
  created_at   timestamptz not null default now()
);
create index progress_photos_user_idx on progress_photos (user_id, taken_at desc);

create table nutrition_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_date   date not null,
  calories   integer, protein_g integer, carbs_g integer, fat_g integer,
  fiber_g    integer, sugar_g integer, water_ml integer,
  notes      text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);
create index nutrition_logs_user_idx on nutrition_logs (user_id, log_date desc);

create table recovery_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  log_date        date not null,
  source          measurement_source not null default 'manual',
  sleep_hours     numeric(4,2),
  sleep_quality   smallint check (sleep_quality between 1 and 5),
  stress          smallint check (stress between 1 and 5),
  mood            smallint check (mood between 1 and 5),
  energy          smallint check (energy between 1 and 5),
  soreness        smallint check (soreness between 1 and 5),
  readiness_score smallint check (readiness_score between 0 and 100),
  notes           text,
  created_at      timestamptz not null default now(),
  unique (user_id, log_date, source)
);
create index recovery_logs_user_idx on recovery_logs (user_id, log_date desc);

-- ---------------------------------------------------------------------------
-- 8. Goals / achievements / notes / journal
-- ---------------------------------------------------------------------------
create table goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  metric        text not null,                  -- 'bench_1rm','bodyweight','streak','protein'...
  exercise_id   uuid references exercises(id) on delete set null,
  target_value  numeric(10,2) not null,
  start_value   numeric(10,2),
  current_value numeric(10,2),
  unit          text,
  deadline      date,
  status        goal_status not null default 'active',
  achieved_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index goals_user_idx on goals (user_id, status);

create table achievements (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text not null,
  icon        text,
  criteria    jsonb not null
);

create table user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  body        text not null,
  is_pinned   boolean not null default false,
  entity_type text,                             -- 'exercise'|'session'|'day'|null
  entity_id   uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index notes_pinned_idx on notes (user_id) where is_pinned;

create table daily_journal (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  body       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

-- ---------------------------------------------------------------------------
-- 9. Views (recovery is computed, never stored)
-- ---------------------------------------------------------------------------
-- security_invoker => the view respects the CALLER's RLS (Postgres 15+/Supabase).
-- Without this, the view runs as owner and would leak every user's sets.
create view muscle_volume_7d with (security_invoker = true) as
select s.user_id,
       em.muscle_group_id,
       sum(case when em.is_primary then 1 else 0.5 end)::numeric as weighted_sets,
       max(s.completed_at)                                        as last_trained_at
from sets s
join session_exercises se on se.id = s.session_exercise_id
join exercise_muscles  em on em.exercise_id = se.exercise_id
where s.is_completed
  and s.completed_at > now() - interval '7 days'
group by s.user_id, em.muscle_group_id;

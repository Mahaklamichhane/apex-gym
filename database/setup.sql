-- ============================================================================
-- Apex Gym — COMBINED SETUP
-- Paste this whole file into the Supabase SQL Editor and Run ONCE.
-- Sections run in dependency order: schema -> functions -> RLS -> seed.
-- Generated from database/migrations/* and database/seed/* (source of truth).
-- Re-running will error on "type already exists" (0001) — that is expected;
-- it just means the schema is already installed. The seed is safe to re-run.
-- ============================================================================


-- ####################  1 / 4  SCHEMA  ####################

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


-- ####################  2 / 4  FUNCTIONS & TRIGGERS  ####################

-- ============================================================================
-- Apex Gym — 0002 functions & triggers
-- Run after 0001. Keeps derived data consistent even if a write bypasses the app.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Generic updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'exercises','user_exercise_meta','profiles','workout_templates',
    'notes'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated_at before update on %1$s
         for each row execute function set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Estimated 1RM on set write (Epley: w * (1 + reps/30))
--    Only for working sets with both weight and reps.
-- ---------------------------------------------------------------------------
create or replace function sets_compute_e1rm()
returns trigger language plpgsql as $$
begin
  if new.weight_kg is not null and new.reps is not null and new.reps > 0
     and new.set_type not in ('warmup') then
    new.est_1rm_kg := round((new.weight_kg * (1 + new.reps / 30.0))::numeric, 2);
  else
    new.est_1rm_kg := null;
  end if;
  return new;
end $$;

create trigger trg_sets_e1rm
  before insert or update of weight_kg, reps, set_type on sets
  for each row execute function sets_compute_e1rm();

-- ---------------------------------------------------------------------------
-- 3. PR detection for one session (called by finalize)
--    Compares completed working sets against current bests, inserts new PRs.
-- ---------------------------------------------------------------------------
create or replace function detect_prs_for_session(p_session_id uuid)
returns void language plpgsql as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from workout_sessions where id = p_session_id;

  -- max_weight, est_1rm, max_reps per exercise from this session's best completed sets
  insert into personal_records (user_id, exercise_id, pr_type, value, set_id, session_id)
  select cand.user_id, cand.exercise_id, cand.pr_type, cand.value, cand.set_id, p_session_id
  from (
    -- best candidate per (exercise, pr_type) within this session
    select distinct on (se.exercise_id, m.pr_type)
           v_user_id                     as user_id,
           se.exercise_id,
           m.pr_type,
           m.value,
           s.id                          as set_id
    from sets s
    join session_exercises se on se.id = s.session_exercise_id
    cross join lateral (values
      ('max_weight'::pr_type, s.weight_kg),
      ('est_1rm'::pr_type,    s.est_1rm_kg),
      ('max_reps'::pr_type,   s.reps::numeric)
    ) as m(pr_type, value)
    where se.session_id = p_session_id
      and s.is_completed
      and s.set_type not in ('warmup')
      and m.value is not null
    order by se.exercise_id, m.pr_type, m.value desc
  ) cand
  where cand.value > coalesce((
      select max(pr.value) from personal_records pr
      where pr.user_id = cand.user_id
        and pr.exercise_id = cand.exercise_id
        and pr.pr_type = cand.pr_type
    ), -1);
end $$;

-- ---------------------------------------------------------------------------
-- 4. Finalize a session when it transitions to 'completed'
--    Computes duration + total volume, then runs PR detection.
-- ---------------------------------------------------------------------------
create or replace function session_finalize()
returns trigger language plpgsql as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.ended_at := coalesce(new.ended_at, now());
    new.duration_seconds := greatest(0,
      extract(epoch from (new.ended_at - new.started_at))::int);

    select coalesce(sum(s.weight_kg * s.reps), 0)
      into new.total_volume_kg
    from sets s
    join session_exercises se on se.id = s.session_exercise_id
    where se.session_id = new.id
      and s.is_completed
      and s.set_type not in ('warmup')
      and s.weight_kg is not null and s.reps is not null;
  end if;
  return new;
end $$;

create trigger trg_session_finalize
  before update of status on workout_sessions
  for each row execute function session_finalize();

-- PR detection runs AFTER the row is committed-visible (needs final sets).
create or replace function session_finalize_after()
returns trigger language plpgsql as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform detect_prs_for_session(new.id);
  end if;
  return new;
end $$;

create trigger trg_session_finalize_after
  after update of status on workout_sessions
  for each row execute function session_finalize_after();

-- ---------------------------------------------------------------------------
-- 5. Auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ####################  3 / 4  ROW LEVEL SECURITY  ####################

-- ============================================================================
-- Apex Gym — 0003 Row Level Security
-- Run after 0001/0002. RLS on EVERY table. Two patterns + the exercises hybrid.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: standard "own rows" policy set for a table with a user_id column.
-- ---------------------------------------------------------------------------
create or replace function apply_owner_policies(p_table text)
returns void language plpgsql as $$
begin
  execute format('alter table %I enable row level security', p_table);
  execute format($f$create policy "own_select" on %I for select using (auth.uid() = user_id)$f$, p_table);
  execute format($f$create policy "own_insert" on %I for insert with check (auth.uid() = user_id)$f$, p_table);
  execute format($f$create policy "own_update" on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)$f$, p_table);
  execute format($f$create policy "own_delete" on %I for delete using (auth.uid() = user_id)$f$, p_table);
end $$;

-- User-owned tables that carry user_id directly -----------------------------
select apply_owner_policies(t) from unnest(array[
  'workout_templates','workout_sessions','sets','personal_records',
  'body_measurements','progress_photos','nutrition_logs','recovery_logs',
  'goals','notes','daily_journal','user_exercise_meta'
]) as t;

-- ---------------------------------------------------------------------------
-- profiles: id IS the user id (no separate user_id column)
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
create policy "own_select" on profiles for select using (auth.uid() = id);
create policy "own_insert" on profiles for insert with check (auth.uid() = id);
create policy "own_update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- user_achievements: composite, user_id is the owner key
-- ---------------------------------------------------------------------------
alter table user_achievements enable row level security;
create policy "own_select" on user_achievements for select using (auth.uid() = user_id);
create policy "own_insert" on user_achievements for insert with check (auth.uid() = user_id);
create policy "own_delete" on user_achievements for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Child tables without a direct user_id: authorize via parent ownership
-- ---------------------------------------------------------------------------
alter table template_exercises enable row level security;
create policy "via_parent" on template_exercises for all using (
  exists (select 1 from workout_templates t
          where t.id = template_exercises.template_id and t.user_id = auth.uid())
) with check (
  exists (select 1 from workout_templates t
          where t.id = template_exercises.template_id and t.user_id = auth.uid())
);

alter table template_sets enable row level security;
create policy "via_parent" on template_sets for all using (
  exists (select 1 from template_exercises te
          join workout_templates t on t.id = te.template_id
          where te.id = template_sets.template_exercise_id and t.user_id = auth.uid())
) with check (
  exists (select 1 from template_exercises te
          join workout_templates t on t.id = te.template_id
          where te.id = template_sets.template_exercise_id and t.user_id = auth.uid())
);

alter table session_exercises enable row level security;
create policy "via_parent" on session_exercises for all using (
  exists (select 1 from workout_sessions ws
          where ws.id = session_exercises.session_id and ws.user_id = auth.uid())
) with check (
  exists (select 1 from workout_sessions ws
          where ws.id = session_exercises.session_id and ws.user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- Global reference tables: read to any authenticated user; writes = service role
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['muscle_groups','equipment','achievements','exercise_alternatives'] loop
    execute format('alter table %I enable row level security', t);
    execute format($f$create policy "read_all" on %I for select using (auth.role() = 'authenticated')$f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- exercises hybrid: global rows (owner_id null) readable by all; custom = private
-- ---------------------------------------------------------------------------
alter table exercises enable row level security;
create policy "read_global_or_own" on exercises for select
  using (owner_id is null or owner_id = auth.uid());
create policy "insert_own" on exercises for insert
  with check (owner_id = auth.uid());
create policy "update_own" on exercises for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "delete_own" on exercises for delete
  using (owner_id = auth.uid());

-- exercise_muscles: readable for any exercise the user can see; writes only for
-- muscles attached to the user's own custom exercises.
alter table exercise_muscles enable row level security;
create policy "read_visible" on exercise_muscles for select using (
  exists (select 1 from exercises e where e.id = exercise_muscles.exercise_id
          and (e.owner_id is null or e.owner_id = auth.uid()))
);
create policy "write_own_exercise" on exercise_muscles for all using (
  exists (select 1 from exercises e where e.id = exercise_muscles.exercise_id
          and e.owner_id = auth.uid())
) with check (
  exists (select 1 from exercises e where e.id = exercise_muscles.exercise_id
          and e.owner_id = auth.uid())
);


-- ####################  4 / 4  SEED REFERENCE DATA  ####################

-- ============================================================================
-- Apex Gym — seed reference data (global, owner_id = null)
-- Run after migrations. Idempotent via ON CONFLICT (slug).
-- Extend the exercise list freely; this is a solid compound-first starter set.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Muscle groups (slug, name, region, svg_id)
-- ---------------------------------------------------------------------------
insert into muscle_groups (slug, name, region, svg_id) values
  ('chest',      'Chest',            'upper', 'chest'),
  ('front_delts','Front Deltoids',   'upper', 'front_delts'),
  ('side_delts', 'Side Deltoids',    'upper', 'side_delts'),
  ('rear_delts', 'Rear Deltoids',    'upper', 'rear_delts'),
  ('biceps',     'Biceps',           'upper', 'biceps'),
  ('triceps',    'Triceps',          'upper', 'triceps'),
  ('forearms',   'Forearms',         'upper', 'forearms'),
  ('lats',       'Lats',             'upper', 'lats'),
  ('traps',      'Trapezius',        'upper', 'traps'),
  ('upper_back', 'Upper Back',       'upper', 'upper_back'),
  ('lower_back', 'Lower Back',       'core',  'lower_back'),
  ('abs',        'Abdominals',       'core',  'abs'),
  ('obliques',   'Obliques',         'core',  'obliques'),
  ('glutes',     'Glutes',           'lower', 'glutes'),
  ('quads',      'Quadriceps',       'lower', 'quads'),
  ('hamstrings', 'Hamstrings',       'lower', 'hamstrings'),
  ('calves',     'Calves',           'lower', 'calves'),
  ('adductors',  'Adductors',        'lower', 'adductors')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Equipment
-- ---------------------------------------------------------------------------
insert into equipment (slug, name) values
  ('barbell','Barbell'), ('dumbbell','Dumbbell'), ('cable','Cable'),
  ('machine','Machine'), ('bodyweight','Bodyweight'), ('kettlebell','Kettlebell'),
  ('bands','Resistance Bands'), ('smith','Smith Machine'), ('ez_bar','EZ Bar')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Exercises + muscle mappings.
-- Helper: insert exercise by name, then map muscles by slug.
-- ---------------------------------------------------------------------------
do $$
declare
  ex record;
  v_ex_id uuid;
  v_eq_id uuid;
  m text;
  -- {name, equipment_slug, difficulty, is_unilateral, primary[], secondary[]}
  rows jsonb := '[
    {"n":"Barbell Bench Press","e":"barbell","d":"intermediate","u":false,
      "p":["chest"],"s":["front_delts","triceps"]},
    {"n":"Incline Dumbbell Press","e":"dumbbell","d":"intermediate","u":false,
      "p":["chest"],"s":["front_delts","triceps"]},
    {"n":"Cable Fly","e":"cable","d":"beginner","u":false,
      "p":["chest"],"s":["front_delts"]},
    {"n":"Overhead Press","e":"barbell","d":"intermediate","u":false,
      "p":["front_delts"],"s":["side_delts","triceps"]},
    {"n":"Lateral Raise","e":"dumbbell","d":"beginner","u":false,
      "p":["side_delts"],"s":[]},
    {"n":"Pull-Up","e":"bodyweight","d":"intermediate","u":false,
      "p":["lats"],"s":["biceps","upper_back"]},
    {"n":"Lat Pulldown","e":"cable","d":"beginner","u":false,
      "p":["lats"],"s":["biceps","upper_back"]},
    {"n":"Barbell Row","e":"barbell","d":"intermediate","u":false,
      "p":["upper_back","lats"],"s":["biceps","rear_delts"]},
    {"n":"Seated Cable Row","e":"cable","d":"beginner","u":false,
      "p":["upper_back"],"s":["lats","biceps"]},
    {"n":"Face Pull","e":"cable","d":"beginner","u":false,
      "p":["rear_delts"],"s":["traps","upper_back"]},
    {"n":"Barbell Curl","e":"barbell","d":"beginner","u":false,
      "p":["biceps"],"s":["forearms"]},
    {"n":"Hammer Curl","e":"dumbbell","d":"beginner","u":true,
      "p":["biceps"],"s":["forearms"]},
    {"n":"Triceps Pushdown","e":"cable","d":"beginner","u":false,
      "p":["triceps"],"s":[]},
    {"n":"Overhead Triceps Extension","e":"dumbbell","d":"beginner","u":false,
      "p":["triceps"],"s":[]},
    {"n":"Back Squat","e":"barbell","d":"intermediate","u":false,
      "p":["quads","glutes"],"s":["hamstrings","lower_back"]},
    {"n":"Front Squat","e":"barbell","d":"advanced","u":false,
      "p":["quads"],"s":["glutes","abs"]},
    {"n":"Leg Press","e":"machine","d":"beginner","u":false,
      "p":["quads","glutes"],"s":["hamstrings"]},
    {"n":"Romanian Deadlift","e":"barbell","d":"intermediate","u":false,
      "p":["hamstrings","glutes"],"s":["lower_back"]},
    {"n":"Deadlift","e":"barbell","d":"advanced","u":false,
      "p":["glutes","hamstrings","lower_back"],"s":["quads","traps","forearms"]},
    {"n":"Leg Curl","e":"machine","d":"beginner","u":false,
      "p":["hamstrings"],"s":[]},
    {"n":"Leg Extension","e":"machine","d":"beginner","u":false,
      "p":["quads"],"s":[]},
    {"n":"Walking Lunge","e":"dumbbell","d":"beginner","u":true,
      "p":["quads","glutes"],"s":["hamstrings"]},
    {"n":"Standing Calf Raise","e":"machine","d":"beginner","u":false,
      "p":["calves"],"s":[]},
    {"n":"Hanging Leg Raise","e":"bodyweight","d":"intermediate","u":false,
      "p":["abs"],"s":["obliques"]},
    {"n":"Cable Crunch","e":"cable","d":"beginner","u":false,
      "p":["abs"],"s":[]},
    {"n":"Plank","e":"bodyweight","d":"beginner","u":false,
      "p":["abs"],"s":["obliques","lower_back"]}
  ]'::jsonb;
begin
  for ex in select * from jsonb_array_elements(rows) as r(v)
  loop
    -- skip if a global exercise with this name already exists
    if exists (select 1 from exercises where name = ex.v->>'n' and owner_id is null) then
      continue;
    end if;

    select id into v_eq_id from equipment where slug = ex.v->>'e';

    insert into exercises (owner_id, name, equipment_id, difficulty, is_unilateral)
    values (null, ex.v->>'n', v_eq_id, (ex.v->>'d')::difficulty, (ex.v->>'u')::boolean)
    returning id into v_ex_id;

    for m in select jsonb_array_elements_text(ex.v->'p')
    loop
      insert into exercise_muscles (exercise_id, muscle_group_id, is_primary)
      select v_ex_id, mg.id, true from muscle_groups mg where mg.slug = m
      on conflict do nothing;
    end loop;

    for m in select jsonb_array_elements_text(ex.v->'s')
    loop
      insert into exercise_muscles (exercise_id, muscle_group_id, is_primary)
      select v_ex_id, mg.id, false from muscle_groups mg where mg.slug = m
      on conflict do nothing;
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Achievements (criteria are machine-checkable by services/achievements)
-- ---------------------------------------------------------------------------
insert into achievements (slug, name, description, icon, criteria) values
  ('first_workout',  'First Steps',      'Complete your first workout.',        'Dumbbell',
     '{"type":"workout_count","gte":1}'),
  ('workouts_100',   'Centurion',        'Complete 100 workouts.',              'Trophy',
     '{"type":"workout_count","gte":100}'),
  ('sets_1000',      'Set Machine',      'Log 1,000 sets.',                     'Layers',
     '{"type":"set_count","gte":1000}'),
  ('hours_100',      'Time Under Tension','Train for 100 hours total.',         'Clock',
     '{"type":"training_hours","gte":100}'),
  ('prs_50',         'Record Breaker',   'Set 50 personal records.',            'Medal',
     '{"type":"pr_count","gte":50}'),
  ('streak_365',     'Year of Iron',     'Maintain a 365-day workout streak.',  'Flame',
     '{"type":"streak_days","gte":365}'),
  ('perfect_month',  'Perfect Month',    'Hit every planned workout in a month.','CalendarCheck',
     '{"type":"perfect_month"}'),
  ('never_miss_mon', 'Never Miss Monday','Train 12 Mondays in a row.',          'CalendarClock',
     '{"type":"weekday_streak","weekday":1,"gte":12}'),
  ('bench_100kg',    'Bench Club',       'Bench press 100 kg.',                 'Award',
     '{"type":"lift_1rm","exercise":"Barbell Bench Press","gte":100}'),
  ('squat_140kg',    'Squat Club',       'Squat 140 kg.',                       'Award',
     '{"type":"lift_1rm","exercise":"Back Squat","gte":140}'),
  ('deadlift_180kg', 'Deadlift Club',    'Deadlift 180 kg.',                    'Award',
     '{"type":"lift_1rm","exercise":"Deadlift","gte":180}')
on conflict (slug) do nothing;

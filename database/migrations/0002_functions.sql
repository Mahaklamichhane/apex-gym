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

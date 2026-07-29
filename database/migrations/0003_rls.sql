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

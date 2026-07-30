-- ============================================================================
-- Apex Gym — 0004 leaderboard
-- A SECURITY DEFINER function that returns per-user AGGREGATE stats across all
-- users (name + workouts + streak + weekly volume) for the friends leaderboard.
-- It runs as owner so it can read across users, but exposes ONLY aggregates +
-- display_name — never anyone's raw workout/set data. Any authenticated user
-- may call it. Run this once in the Supabase SQL Editor.
--
-- Rule: only workouts lasting >= 30 minutes (1800s) count toward stats.
-- ============================================================================

create or replace function public.get_leaderboard()
returns table (
  user_id       uuid,
  display_name  text,
  workouts      integer,
  streak        integer,
  weekly_volume numeric
)
language sql
security definer
set search_path = public
as $$
  with qualifying as (
    select user_id, started_at, total_volume_kg
    from workout_sessions
    where status = 'completed'
      and coalesce(duration_seconds, 0) >= 1800   -- >= 30 min only
  ),
  days as (
    select distinct user_id, (started_at)::date as d from qualifying
  ),
  -- gaps-and-islands: group consecutive calendar days per user
  ranked as (
    select user_id, d,
           d - (row_number() over (partition by user_id order by d))::int as grp
    from days
  ),
  islands as (
    select user_id, count(*)::int as len, max(d) as last_day
    from ranked
    group by user_id, grp
  ),
  streaks as (
    -- current streak = the island that ends today or yesterday
    select user_id, len as streak
    from islands
    where last_day >= current_date - 1
  ),
  totals as (
    select user_id,
           count(*)::int as workouts,
           coalesce(
             sum(total_volume_kg) filter (where started_at > now() - interval '7 days'),
             0
           ) as weekly_volume
    from qualifying
    group by user_id
  )
  select
    p.id                                as user_id,
    coalesce(p.display_name, 'Athlete') as display_name,
    coalesce(t.workouts, 0)             as workouts,
    coalesce(s.streak, 0)               as streak,
    coalesce(t.weekly_volume, 0)        as weekly_volume
  from profiles p
  left join totals  t on t.user_id = p.id
  left join streaks s on s.user_id = p.id
  order by s.streak desc nulls last, t.workouts desc nulls last;
$$;

revoke all     on function public.get_leaderboard() from public;
grant  execute on function public.get_leaderboard() to authenticated;

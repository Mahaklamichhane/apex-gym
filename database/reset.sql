-- ============================================================================
-- Apex Gym — RESET  (⚠️ DESTRUCTIVE)
-- Drops the ENTIRE public schema — every table, type, function, and ALL DATA.
-- Use only to get a clean slate (e.g. after a half-finished setup.sql run).
-- SAFE on a fresh project with no real data. Run this, THEN run setup.sql.
-- Does NOT touch the auth / storage schemas or your users.
-- ============================================================================

-- Remove the trigger we added on auth.users (it references public.* objects).
drop trigger if exists trg_on_auth_user_created on auth.users;

-- Nuke and recreate the public schema.
drop schema if exists public cascade;
create schema public;

-- Restore the grants Supabase expects on a clean public schema.
grant usage on schema public to anon, authenticated, service_role;
grant all   on schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;

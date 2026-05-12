-- =============================================================================
-- ensure_user_stats.sql
-- Run once in the Supabase SQL editor (or via psql).
-- Does two things:
--   1. Backfills user_stats rows for every existing profile that is missing one.
--   2. Creates a trigger so that every future profile insert automatically gets
--      a user_stats row — regardless of which code path created the profile.
-- Safe to re-run: all statements are idempotent.
-- =============================================================================

-- ─── 1. Backfill existing profiles ───────────────────────────────────────────
-- Inserts a zero-stats row for every profile that has no user_stats record yet.
-- gen_random_uuid()::text produces a unique string ID compatible with Prisma's
-- cuid-typed @id field (uniqueness is what matters, not the format).

INSERT INTO user_stats (id, profile_id, updated_at)
SELECT
  gen_random_uuid()::text,
  p.id,
  NOW()
FROM profiles p
LEFT JOIN user_stats us ON us.profile_id = p.id
WHERE us.id IS NULL;

-- ─── 2. Trigger function ──────────────────────────────────────────────────────
-- Called automatically after every INSERT on profiles.
-- ON CONFLICT … DO NOTHING makes it safe even if the row already exists.

CREATE OR REPLACE FUNCTION public.ensure_user_stats_on_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_stats (id, profile_id, updated_at)
  VALUES (gen_random_uuid()::text, NEW.id, NOW())
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─── 3. Attach trigger to profiles table ─────────────────────────────────────

DROP TRIGGER IF EXISTS trg_ensure_user_stats ON profiles;

CREATE TRIGGER trg_ensure_user_stats
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_stats_on_profile_insert();

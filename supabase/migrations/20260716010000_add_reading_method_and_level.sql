-- Phase 1 self-assessment: capture reading method + user leveling (PRD Phase 1)
-- Adds diagnostic_session.reading_method (how the user read) and profiles.level (default 1).
-- Level is updated via a SECURITY DEFINER function so users never get a direct UPDATE
-- policy on profiles (RLS is row-level only — a user UPDATE policy would allow role
-- escalation to admin).

-- 1. Reading method enum: "out_loud" | "inner_voice" | "visual_only"
CREATE TYPE reading_method AS ENUM ('out_loud', 'inner_voice', 'visual_only');

-- 2. Store the self-assessed reading method on each diagnostic session
ALTER TABLE diagnostic_session
  ADD COLUMN reading_method reading_method;

-- 3. User leveling: every user starts at Level 1 on first diagnostic (PRD Phase 1)
ALTER TABLE public.profiles
  ADD COLUMN level INTEGER NOT NULL DEFAULT 1;

-- 4. SECURITY DEFINER helper: set the user's level on their first completed diagnostic.
--    Runs as the function owner (superuser), bypassing RLS, so no user UPDATE policy on
--    profiles is needed. Only touches the level column; refuses to downgrade below 1.
CREATE OR REPLACE FUNCTION public.set_user_level(p_user_id UUID, p_level INTEGER)
RETURNS VOID AS $$
BEGIN
  IF p_level < 1 THEN
    RAISE EXCEPTION 'level must be >= 1';
  END IF;
  UPDATE public.profiles
    SET level = p_level
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Index for level-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level);
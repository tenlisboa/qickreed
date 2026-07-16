-- QICA-12: Post-RSVP cognitive validation (Phase 4 wiring).
--
-- Adds the persistence + benchmark fields needed by the post-RSVP comprehension
-- flow and lets users UPDATE their own training_session rows so the server can
-- write comprehension_score / passed after the quiz.

-- 1. training_session: comprehension_score + passed (idempotent).
ALTER TABLE training_session
  ADD COLUMN IF NOT EXISTS comprehension_score DECIMAL(5, 2);

ALTER TABLE training_session
  ADD COLUMN IF NOT EXISTS passed BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_training_session_comprehension
  ON training_session (comprehension_score);

CREATE INDEX IF NOT EXISTS idx_training_session_passed
  ON training_session (passed);

CREATE INDEX IF NOT EXISTS idx_training_session_user_passed
  ON training_session (user_id, passed);

-- 2. profiles: benchmark_wpm — the validated PPM that becomes the user's new
--    target after a passing RSVP session, or the reduced target after a fail.
--    Seeded from the latest diagnostic_session.wpm * 1.2 on first use by the
--    application layer (training/actions.ts).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS benchmark_wpm INTEGER;

CREATE INDEX IF NOT EXISTS idx_profiles_benchmark_wpm
  ON profiles (benchmark_wpm);

-- 3. Let users UPDATE their own training_session rows (comprehension_score,
--    passed). Existing INSERT/SELECT policies are unchanged.
CREATE POLICY "Users can update own training sessions"
  ON training_session
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);
-- Allow authenticated (non-admin) users to create their own training texts from
-- pasted content (QICA-15: paste box -> LLM -> enable Start Training).
--
-- The text table previously only allowed admin writes (FOR ALL via is_admin()).
-- We add an optional owner column and an INSERT policy scoped to it so members
-- can create training texts they own, while admin-created texts remain ownerless.

-- 1. Add nullable owner column (null = admin/legacy text)
ALTER TABLE text
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Index owner lookups
CREATE INDEX idx_text_user_id ON text(user_id) WHERE user_id IS NOT NULL;

-- 3. Let authenticated users INSERT rows they own.
--    Admins keep unrestricted access via the existing "Admins can manage texts"
--    FOR ALL policy (is_admin()), which also covers INSERT.
CREATE POLICY "Users can insert own training texts" ON text
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. Owners can update/delete their own training texts.
CREATE POLICY "Users can update own training texts" ON text
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own training texts" ON text
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
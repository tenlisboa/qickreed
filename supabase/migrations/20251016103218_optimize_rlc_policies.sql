-- Optimize RLS policies for better performance
-- Replace auth.<function>() with (SELECT auth.<function>()) to avoid re-evaluation per row

-- Drop existing policies
DROP POLICY IF EXISTS "Text is viewable by authenticated users" ON text;
DROP POLICY IF EXISTS "Users can view own diagnostic sessions" ON diagnostic_session;
DROP POLICY IF EXISTS "Users can insert own diagnostic sessions" ON diagnostic_session;
DROP POLICY IF EXISTS "Users can view own training sessions" ON training_session;
DROP POLICY IF EXISTS "Users can insert own training sessions" ON training_session;

-- Create optimized RLS policies
-- Text table: all authenticated users can read (optimized)
CREATE POLICY "Text is viewable by authenticated users" ON text
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- Diagnostic session: users can only see their own sessions (optimized)
CREATE POLICY "Users can view own diagnostic sessions" ON diagnostic_session
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own diagnostic sessions" ON diagnostic_session
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Training session: users can only see their own sessions (optimized)
CREATE POLICY "Users can view own training sessions" ON training_session
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own training sessions" ON training_session
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

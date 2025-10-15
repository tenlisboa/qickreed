-- Create text_types enum
CREATE TYPE text_type AS ENUM ('diagnostic', 'training');

-- Create text table
CREATE TABLE text (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type text_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    num_words INTEGER NOT NULL,
    quiz_json JSONB,
    language VARCHAR(10) DEFAULT 'pt-BR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagnostic_session table
CREATE TABLE diagnostic_session (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text_id UUID NOT NULL REFERENCES text(id) ON DELETE CASCADE,
    reading_time_ms INTEGER NOT NULL,
    comprehension_score DECIMAL(5,2) NOT NULL,
    wpm DECIMAL(8,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_session table (for future RSVP module)
CREATE TABLE training_session (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text_id UUID NOT NULL REFERENCES text(id) ON DELETE CASCADE,
    target_wpm INTEGER NOT NULL,
    duration_time_s INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_diagnostic_session_user_id ON diagnostic_session(user_id);
CREATE INDEX idx_diagnostic_session_created_at ON diagnostic_session(created_at DESC);
CREATE INDEX idx_training_session_user_id ON training_session(user_id);
CREATE INDEX idx_text_type ON text(type);
CREATE INDEX idx_text_language ON text(language);

-- Enable Row Level Security (RLS)
ALTER TABLE text ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_session ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Text table: all authenticated users can read
CREATE POLICY "Text is viewable by authenticated users" ON text
    FOR SELECT USING (auth.role() = 'authenticated');

-- Diagnostic session: users can only see their own sessions
CREATE POLICY "Users can view own diagnostic sessions" ON diagnostic_session
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnostic sessions" ON diagnostic_session
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Training session: users can only see their own sessions
CREATE POLICY "Users can view own training sessions" ON training_session
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training sessions" ON training_session
    FOR INSERT WITH CHECK (auth.uid() = user_id);

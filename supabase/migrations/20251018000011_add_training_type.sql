-- Create training_type enum
CREATE TYPE training_type AS ENUM ('rsvp');

-- Add training_type column to training_session table
ALTER TABLE training_session 
ADD COLUMN training_type training_type NOT NULL DEFAULT 'rsvp';

-- Update RLS policies for training_session with training_type
-- (existing policies already cover the basic access, no changes needed)

-- Add index for better performance on training_type queries
CREATE INDEX idx_training_session_training_type ON training_session(training_type);
CREATE INDEX idx_training_session_user_training_type ON training_session(user_id, training_type);

CREATE TABLE training_session_submissions (
    submission_id VARCHAR(128) PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL REFERENCES training_sessions (session_id) ON DELETE CASCADE,
    scenario_slug VARCHAR(255) NOT NULL,
    scenario_title VARCHAR(512) NOT NULL,
    scenario_source VARCHAR(255) NOT NULL,
    attempt_number INTEGER NOT NULL,
    answer_type VARCHAR(64) NOT NULL,
    answer_value TEXT NOT NULL,
    correctness VARCHAR(64) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_training_session_submissions_session_attempt
    ON training_session_submissions (session_id, attempt_number);

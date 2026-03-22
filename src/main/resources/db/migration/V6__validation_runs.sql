CREATE TABLE validation_runs (
    validation_run_id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    submission_id VARCHAR(255) NOT NULL,
    scenario_slug VARCHAR(255) NOT NULL,
    answer_type VARCHAR(64) NOT NULL,
    answer_value TEXT NOT NULL,
    validator_spec_id VARCHAR(255),
    validator_type VARCHAR(64),
    runner_kind VARCHAR(64) NOT NULL,
    runner_status VARCHAR(64) NOT NULL,
    outcome_status VARCHAR(64),
    outcome_correctness VARCHAR(64),
    outcome_code VARCHAR(128) NOT NULL,
    outcome_message TEXT NOT NULL,
    duration_ms BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_validation_runs_session_id
    ON validation_runs (session_id, created_at DESC);

CREATE INDEX idx_validation_runs_submission_id
    ON validation_runs (submission_id);

CREATE INDEX idx_validation_runs_scenario_slug
    ON validation_runs (scenario_slug, created_at DESC);

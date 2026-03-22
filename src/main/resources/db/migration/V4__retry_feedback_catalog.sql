CREATE TABLE authored_scenario_retry_guidance (
    scenario_slug VARCHAR(255) PRIMARY KEY
        REFERENCES authored_scenarios (scenario_slug) ON DELETE CASCADE,
    incorrect_explanation_code VARCHAR(128) NOT NULL,
    incorrect_focus VARCHAR(255) NOT NULL,
    incorrect_hint_template_code VARCHAR(128) NOT NULL
);

CREATE TABLE retry_feedback_templates (
    template_code VARCHAR(128) PRIMARY KEY,
    template_type VARCHAR(32) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_retry_feedback_templates_type
    ON retry_feedback_templates (template_type);

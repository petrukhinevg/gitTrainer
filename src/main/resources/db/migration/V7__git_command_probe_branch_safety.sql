ALTER TABLE authored_scenario_validator_specs
    ADD COLUMN config_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE authored_scenario_validator_specs
SET validator_type = 'git_command_probe',
    config_payload = '{
      "expectedExitCode": 0,
      "expectedStdout": "release/hotfix-7",
      "workspaceTemplate": {
        "initialBranch": "main",
        "currentBranch": "release/hotfix-7",
        "branches": ["release/hotfix-7", "feature/menu-refresh", "main"],
        "committedFiles": [
          { "path": "src/ui/header.css", "content": ".header { padding: 8px; }\n" },
          { "path": "docs/release-checklist.md", "content": "- verify deploy\n" }
        ],
        "modifiedFiles": [
          { "path": "src/ui/header.css", "content": ".header { padding: 12px; }\n" },
          { "path": "docs/release-checklist.md", "content": "- verify deploy\n- smoke test\n" }
        ],
        "untrackedFiles": []
      }
    }'::jsonb
WHERE scenario_slug = 'branch-safety'
  AND answer_type = 'command_text';

DELETE FROM authored_scenario_validator_rules
WHERE validator_spec_id = 'default:branch-safety:command_text';

INSERT INTO authored_scenario_validator_rules (
    validator_spec_id,
    position,
    match_type,
    raw_match_value,
    normalized_match_value,
    outcome_correctness,
    outcome_code,
    outcome_message
)
VALUES (
    'default:branch-safety:command_text',
    1,
    'exact_normalized_command',
    'git branch --show-current',
    'git branch --show-current',
    'correct',
    'expected-command',
    'Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария.'
)
ON CONFLICT (validator_spec_id, normalized_match_value) DO NOTHING;

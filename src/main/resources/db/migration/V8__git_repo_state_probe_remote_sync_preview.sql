UPDATE authored_scenario_validator_specs
SET validator_type = 'git_repo_state_probe',
    config_payload = '{
      "expectedExitCode": 0,
      "workspaceTemplate": {
        "initialBranch": "main",
        "remoteName": "origin",
        "localAheadCommitMessage": "local notes WIP",
        "remoteAheadCommitMessage": "remote hotfix ready",
        "baseFiles": [
          { "path": "README.md", "content": "# Git Trainer\n" },
          { "path": "docs/sync-playbook.md", "content": "- inspect divergence\n" }
        ],
        "localAheadFiles": [
          { "path": "docs/local-notes.md", "content": "- pending local integration\n" }
        ],
        "remoteAheadFiles": [
          { "path": "release/remote-hotfix.md", "content": "- hotfix available upstream\n" }
        ]
      },
      "expectedState": {
        "currentBranch": "main",
        "localHeadCommitMessage": "local notes WIP",
        "fetchHeadCommitMessage": "remote hotfix ready",
        "remoteTrackingRefs": [
          { "ref": "refs/remotes/origin/main", "commitMessage": "remote hotfix ready" }
        ]
      }
    }'::jsonb
WHERE scenario_slug = 'remote-sync-preview'
  AND answer_type = 'command_text';

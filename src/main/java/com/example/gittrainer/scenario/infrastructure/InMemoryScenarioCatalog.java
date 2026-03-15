package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioCatalog;
import com.example.gittrainer.scenario.domain.ScenarioCatalogSummary;
import com.example.gittrainer.scenario.domain.ScenarioDifficulty;
import com.example.gittrainer.scenario.domain.ScenarioTopic;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class InMemoryScenarioCatalog implements ScenarioCatalog {

    private final List<ScenarioCatalogSummary> summaries = List.of(
            new ScenarioCatalogSummary(
                    "status-clean-working-tree",
                    "Inspect a clean working tree",
                    "Choose the Git command that confirms the repository has no pending changes.",
                    ScenarioTopic.STATUS,
                    ScenarioDifficulty.BEGINNER,
                    10,
                    5
            ),
            new ScenarioCatalogSummary(
                    "status-untracked-file",
                    "Inspect untracked work",
                    "Identify the command that shows a newly created file is not yet tracked.",
                    ScenarioTopic.STATUS,
                    ScenarioDifficulty.BEGINNER,
                    20,
                    5
            ),
            new ScenarioCatalogSummary(
                    "branch-create-feature",
                    "Create a feature branch",
                    "Pick the command that creates a new branch for isolated work.",
                    ScenarioTopic.BRANCH,
                    ScenarioDifficulty.BEGINNER,
                    30,
                    7
            ),
            new ScenarioCatalogSummary(
                    "branch-switch-feature",
                    "Switch to an existing branch",
                    "Choose the command that moves the working copy onto an existing feature branch.",
                    ScenarioTopic.BRANCH,
                    ScenarioDifficulty.BEGINNER,
                    40,
                    7
            ),
            new ScenarioCatalogSummary(
                    "history-inspect-recent-commits",
                    "Inspect recent commits",
                    "Select the command that shows the latest commits so the learner can inspect project history.",
                    ScenarioTopic.HISTORY,
                    ScenarioDifficulty.BEGINNER,
                    50,
                    8
            ),
            new ScenarioCatalogSummary(
                    "rebase-linearize-feature-branch",
                    "Linearize a feature branch with rebase",
                    "Choose the command sequence starter that prepares a feature branch to be replayed on top of main.",
                    ScenarioTopic.REBASE,
                    ScenarioDifficulty.INTERMEDIATE,
                    60,
                    12
            ),
            new ScenarioCatalogSummary(
                    "conflict-resolve-simple-merge",
                    "Resolve a simple merge conflict",
                    "Identify the starter scenario that walks through resolving a straightforward merge conflict.",
                    ScenarioTopic.CONFLICT,
                    ScenarioDifficulty.INTERMEDIATE,
                    70,
                    12
            )
    );

    @Override
    public List<ScenarioCatalogSummary> listSummaries() {
        return summaries;
    }
}

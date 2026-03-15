package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.domain.ScenarioDifficulty;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ScenarioCatalogFixtureSource {

    private static final ScenarioCatalogFixture DEFAULT_CATALOG = new ScenarioCatalogFixture(
            "mvp-fixture",
            List.of(
                    new ScenarioSummary(
                            "status-basics",
                            "status-basics",
                            "Read the working tree before acting",
                            "Inspect a noisy repository and identify the next safe Git command before making changes.",
                            ScenarioDifficulty.BEGINNER,
                            List.of("status", "working-tree", "basics")
                    ),
                    new ScenarioSummary(
                            "branch-safety",
                            "branch-safety",
                            "Choose the right branch before editing",
                            "Spot the active branch, compare task intent, and decide whether to stay put or switch first.",
                            ScenarioDifficulty.BEGINNER,
                            List.of("branching", "navigation", "basics")
                    ),
                    new ScenarioSummary(
                            "history-cleanup-preview",
                            "history-cleanup-preview",
                            "Preview a history cleanup plan",
                            "Read a messy commit stack and prepare for a later cleanup exercise without changing history yet.",
                            ScenarioDifficulty.INTERMEDIATE,
                            List.of("history", "cleanup", "planning")
                    ),
                    new ScenarioSummary(
                            "remote-sync-preview",
                            "remote-sync-preview",
                            "Read remote tracking state before you pull",
                            "Compare ahead-behind cues and choose whether a fetch or pull makes sense before syncing.",
                            ScenarioDifficulty.INTERMEDIATE,
                            List.of("remote", "inspection", "planning")
                    )
            )
    );

    private static final ScenarioCatalogFixture EMPTY_CATALOG = new ScenarioCatalogFixture(
            "mvp-fixture-empty",
            List.of()
    );

    public ScenarioCatalogFixture defaultCatalog() {
        return DEFAULT_CATALOG;
    }

    public ScenarioCatalogFixture emptyCatalog() {
        return EMPTY_CATALOG;
    }

    public ScenarioCatalogFixture unavailableCatalog() {
        throw new ScenarioCatalogSourceUnavailableException(
                "mvp-fixture-unavailable",
                "Catalog source is unavailable right now. Try another provider."
        );
    }
}

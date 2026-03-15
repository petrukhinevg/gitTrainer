package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioCatalogGateway;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioDifficulty;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class StubScenarioCatalogGateway implements ScenarioCatalogGateway {

    private static final List<ScenarioSummary> STUB_CATALOG = List.of(
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
            )
    );

    @Override
    public List<ScenarioSummary> loadCatalog(CatalogBrowseQuery query) {
        return STUB_CATALOG;
    }

    @Override
    public String sourceName() {
        return "stub";
    }
}

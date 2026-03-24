package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.domain.ScenarioSummary;

import java.util.List;

public record SeedScenarioCatalog(
        String sourceName,
        List<ScenarioSummary> items
) {

    public SeedScenarioCatalog {
        items = items == null ? List.of() : List.copyOf(items);
    }
}

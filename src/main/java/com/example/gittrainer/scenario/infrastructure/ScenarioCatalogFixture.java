package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.domain.ScenarioSummary;

import java.util.List;

public record ScenarioCatalogFixture(
        String sourceName,
        List<ScenarioSummary> items
) {

    public ScenarioCatalogFixture {
        items = items == null ? List.of() : List.copyOf(items);
    }
}

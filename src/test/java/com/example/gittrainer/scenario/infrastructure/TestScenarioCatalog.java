package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.domain.ScenarioSummary;

import java.util.List;

public record TestScenarioCatalog(
        String sourceName,
        List<ScenarioSummary> items
) {

    public TestScenarioCatalog {
        items = items == null ? List.of() : List.copyOf(items);
    }
}

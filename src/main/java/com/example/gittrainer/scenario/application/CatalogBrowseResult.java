package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioSummary;

import java.util.List;

public record CatalogBrowseResult(
        List<ScenarioSummary> items,
        CatalogBrowseQuery query,
        String source
) {

    public CatalogBrowseResult {
        items = items == null ? List.of() : List.copyOf(items);
    }
}

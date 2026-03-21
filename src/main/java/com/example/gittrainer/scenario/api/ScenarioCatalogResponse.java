package com.example.gittrainer.scenario.api;

import java.util.List;

public record ScenarioCatalogResponse(
        List<ScenarioSummaryResponse> items,
        ScenarioCatalogMetaResponse meta
) {
}

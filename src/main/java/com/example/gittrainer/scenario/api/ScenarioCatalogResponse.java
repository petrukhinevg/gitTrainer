package com.example.gittrainer.scenario.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

public record ScenarioCatalogResponse(
        List<ScenarioSummaryResponse> items,
        ScenarioCatalogMetaResponse meta
) {
}

record ScenarioSummaryResponse(
        String id,
        String slug,
        String title,
        String summary,
        String difficulty,
        List<String> tags
) {
}

record ScenarioCatalogMetaResponse(
        String source,
        ScenarioCatalogQueryResponse query
) {
}

@JsonInclude(JsonInclude.Include.NON_NULL)
record ScenarioCatalogQueryResponse(
        String difficulty,
        List<String> tags,
        String sort
) {
}

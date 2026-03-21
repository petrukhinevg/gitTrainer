package com.example.gittrainer.scenario.api;

import java.util.List;

public record ScenarioDetailResponse(
        String id,
        String slug,
        String title,
        String summary,
        String difficulty,
        List<String> tags,
        ScenarioDetailMetaResponse meta,
        ScenarioWorkspaceResponse workspace
) {
}

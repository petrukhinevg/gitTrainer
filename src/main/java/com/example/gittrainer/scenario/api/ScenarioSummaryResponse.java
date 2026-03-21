package com.example.gittrainer.scenario.api;

import java.util.List;

record ScenarioSummaryResponse(
        String id,
        String slug,
        String title,
        String summary,
        String difficulty,
        List<String> tags
) {
}

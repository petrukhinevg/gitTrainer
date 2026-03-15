package com.example.gittrainer.scenario.api;

public record ScenarioCatalogSummaryResponse(
        String id,
        String title,
        String summary,
        String topic,
        String difficulty,
        int catalogOrder,
        int estimatedMinutes
) {
}

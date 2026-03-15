package com.example.gittrainer.scenario.domain;

public record ScenarioCatalogSummary(
        String id,
        String title,
        String summary,
        ScenarioTopic topic,
        ScenarioDifficulty difficulty,
        int catalogOrder,
        int estimatedMinutes
) {
}

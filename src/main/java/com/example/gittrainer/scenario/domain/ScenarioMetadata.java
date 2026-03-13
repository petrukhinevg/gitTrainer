package com.example.gittrainer.scenario.domain;

import java.util.Objects;

public record ScenarioMetadata(
        String title,
        ScenarioTopic topic,
        ScenarioDifficulty difficulty,
        String summary
) {

    public ScenarioMetadata {
        title = requireText(title, "title");
        topic = Objects.requireNonNull(topic, "topic must not be null");
        difficulty = Objects.requireNonNull(difficulty, "difficulty must not be null");
        summary = requireText(summary, "summary");
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        return value;
    }
}

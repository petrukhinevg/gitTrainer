package com.example.gittrainer.scenario.domain;

import java.util.Objects;

public record ScenarioMetadata(
        ScenarioId id,
        String title,
        ScenarioTopic topic,
        ScenarioDifficulty difficulty,
        String summary
) {

    public ScenarioMetadata {
        id = Objects.requireNonNull(id, "id must not be null");
        title = ScenarioText.requireTrimmed(title, "title");
        topic = Objects.requireNonNull(topic, "topic must not be null");
        difficulty = Objects.requireNonNull(difficulty, "difficulty must not be null");
        summary = ScenarioText.requireTrimmed(summary, "summary");
    }
}

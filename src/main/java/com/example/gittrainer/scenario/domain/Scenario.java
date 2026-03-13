package com.example.gittrainer.scenario.domain;

import java.util.List;
import java.util.Objects;

public record Scenario(
        ScenarioId id,
        ScenarioMetadata metadata,
        List<ScenarioStep> steps
) {

    public Scenario {
        id = Objects.requireNonNull(id, "id must not be null");
        metadata = Objects.requireNonNull(metadata, "metadata must not be null");
        steps = List.copyOf(Objects.requireNonNull(steps, "steps must not be null"));

        if (steps.isEmpty()) {
            throw new IllegalArgumentException("steps must not be empty");
        }

        for (int index = 0; index < steps.size(); index++) {
            int expectedOrder = index + 1;
            ScenarioStep step = steps.get(index);
            if (step.order() != expectedOrder) {
                throw new IllegalArgumentException("steps must be ordered sequentially starting from 1");
            }
        }
    }
}

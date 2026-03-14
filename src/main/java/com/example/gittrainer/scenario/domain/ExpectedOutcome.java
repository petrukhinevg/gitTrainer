package com.example.gittrainer.scenario.domain;

import java.util.List;
import java.util.Objects;

public record ExpectedOutcome(
        OutcomeType type,
        String target,
        List<String> acceptableRepresentations
) {

    public ExpectedOutcome {
        type = Objects.requireNonNull(type, "type must not be null");
        target = ScenarioText.requireTrimmed(target, "target");
        acceptableRepresentations = List.copyOf(
                Objects.requireNonNull(acceptableRepresentations, "acceptableRepresentations must not be null")
        );

        if (acceptableRepresentations.isEmpty()) {
            throw new IllegalArgumentException("acceptableRepresentations must not be empty");
        }

        if (acceptableRepresentations.stream().anyMatch(value -> value == null || value.isBlank())) {
            throw new IllegalArgumentException("acceptableRepresentations must not contain blank values");
        }
    }
}

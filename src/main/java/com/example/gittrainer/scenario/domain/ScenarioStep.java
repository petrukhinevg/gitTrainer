package com.example.gittrainer.scenario.domain;

import java.util.Objects;

public record ScenarioStep(
        int order,
        String instruction,
        ExpectedOutcome expectedOutcome,
        String explanation
) {

    public ScenarioStep {
        if (order < 1) {
            throw new IllegalArgumentException("step order must be greater than 0");
        }

        instruction = ScenarioText.requireTrimmed(instruction, "instruction");
        expectedOutcome = Objects.requireNonNull(expectedOutcome, "expectedOutcome must not be null");
        explanation = ScenarioText.requireTrimmed(explanation, "explanation");
    }
}

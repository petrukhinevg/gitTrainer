package com.example.gittrainer.scenario.domain;

import java.util.List;
import java.util.Objects;

public record ExpectedOutcome(
        OutcomeType type,
        String successDescription,
        List<String> acceptedAnswers
) {

    public ExpectedOutcome {
        type = Objects.requireNonNull(type, "type must not be null");
        if (successDescription == null || successDescription.isBlank()) {
            throw new IllegalArgumentException("successDescription must not be blank");
        }
        acceptedAnswers = List.copyOf(Objects.requireNonNull(acceptedAnswers, "acceptedAnswers must not be null"));
        if (acceptedAnswers.isEmpty()) {
            throw new IllegalArgumentException("acceptedAnswers must not be empty");
        }
        if (acceptedAnswers.stream().anyMatch(answer -> answer == null || answer.isBlank())) {
            throw new IllegalArgumentException("acceptedAnswers must not contain blank values");
        }
    }
}

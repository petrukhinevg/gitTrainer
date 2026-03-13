package com.example.gittrainer.scenario.domain;

import java.util.List;
import java.util.Objects;

public record ExpectedOutcome(
        OutcomeType type,
        String successDescription,
        List<String> acceptedAnswers,
        RepositoryStateSnapshot targetRepositoryState
) {

    public ExpectedOutcome(OutcomeType type, String successDescription, List<String> acceptedAnswers) {
        this(type, successDescription, acceptedAnswers, null);
    }

    public ExpectedOutcome(OutcomeType type, String successDescription, RepositoryStateSnapshot targetRepositoryState) {
        this(type, successDescription, List.of(), targetRepositoryState);
    }

    public ExpectedOutcome {
        type = Objects.requireNonNull(type, "type must not be null");
        if (successDescription == null || successDescription.isBlank()) {
            throw new IllegalArgumentException("successDescription must not be blank");
        }
        acceptedAnswers = List.copyOf(Objects.requireNonNull(acceptedAnswers, "acceptedAnswers must not be null"));
        if (acceptedAnswers.stream().anyMatch(answer -> answer == null || answer.isBlank())) {
            throw new IllegalArgumentException("acceptedAnswers must not contain blank values");
        }
        if (type == OutcomeType.REPOSITORY_STATE && targetRepositoryState == null) {
            throw new IllegalArgumentException("repository state outcomes must define a target repository state");
        }
        if ((type == OutcomeType.COMMAND || type == OutcomeType.COMMAND_SEQUENCE) && acceptedAnswers.isEmpty()) {
            throw new IllegalArgumentException("command outcomes must define accepted answers");
        }
        if (acceptedAnswers.isEmpty() && targetRepositoryState == null) {
            throw new IllegalArgumentException("expected outcome must define accepted answers or a target repository state");
        }
    }
}

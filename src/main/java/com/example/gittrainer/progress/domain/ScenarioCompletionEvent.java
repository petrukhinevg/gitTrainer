package com.example.gittrainer.progress.domain;

import java.time.Instant;

public record ScenarioCompletionEvent(
        String scenarioSlug,
        String scenarioTitle,
        String scenarioSource,
        String sessionId,
        String submissionId,
        Instant completedAt
) {

    public static ScenarioCompletionEvent from(ScenarioAttemptOutcome attemptOutcome) {
        return new ScenarioCompletionEvent(
                attemptOutcome.scenarioSlug(),
                attemptOutcome.scenarioTitle(),
                attemptOutcome.scenarioSource(),
                attemptOutcome.sessionId(),
                attemptOutcome.submissionId(),
                attemptOutcome.submittedAt()
        );
    }
}

package com.example.gittrainer.session.domain;

import java.time.Instant;

public record TrainingSession(
        String sessionId,
        String scenarioSlug,
        String scenarioTitle,
        String scenarioSource,
        Instant startedAt,
        SessionState state,
        int submissionCount,
        int consecutiveFailureCount,
        String lastSubmissionId
) {

    public TrainingSession recordSubmission(String submissionId, boolean failedAttempt) {
        return new TrainingSession(
                sessionId,
                scenarioSlug,
                scenarioTitle,
                scenarioSource,
                startedAt,
                state,
                submissionCount + 1,
                failedAttempt ? consecutiveFailureCount + 1 : 0,
                submissionId
        );
    }
}

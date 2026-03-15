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
        String lastSubmissionId
) {

    public TrainingSession recordSubmission(String submissionId) {
        return new TrainingSession(
                sessionId,
                scenarioSlug,
                scenarioTitle,
                scenarioSource,
                startedAt,
                state,
                submissionCount + 1,
                submissionId
        );
    }
}

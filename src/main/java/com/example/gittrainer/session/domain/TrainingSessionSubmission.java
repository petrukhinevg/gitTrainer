package com.example.gittrainer.session.domain;

import java.time.Instant;

public record TrainingSessionSubmission(
        String submissionId,
        String sessionId,
        String scenarioSlug,
        String scenarioTitle,
        String scenarioSource,
        int attemptNumber,
        String answerType,
        String answerValue,
        String correctness,
        Instant submittedAt
) {
}

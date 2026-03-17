package com.example.gittrainer.progress.domain;

import java.time.Instant;

public record ScenarioAttemptOutcome(
        String scenarioSlug,
        String scenarioTitle,
        String scenarioSource,
        String sessionId,
        String submissionId,
        String correctness,
        Instant submittedAt
) {
}

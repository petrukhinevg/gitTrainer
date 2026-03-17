package com.example.gittrainer.progress.domain;

import java.time.Instant;

public record ScenarioProgressRecord(
        String scenarioSlug,
        String scenarioTitle,
        String scenarioSource,
        Instant firstStartedAt,
        Instant lastStartedAt,
        Instant lastSubmittedAt,
        String lastSessionId,
        String lastSubmissionId,
        String lastCorrectness,
        int attemptCount,
        int completionCount,
        Instant lastCompletedAt
) {
}

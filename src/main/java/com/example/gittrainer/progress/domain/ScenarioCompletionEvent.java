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
}

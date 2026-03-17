package com.example.gittrainer.progress.api;

import java.time.Instant;

public record ProgressSummaryItemResponse(
        String scenarioSlug,
        String scenarioTitle,
        String status,
        int attemptCount,
        int completionCount,
        Instant lastActivityAt
) {
}

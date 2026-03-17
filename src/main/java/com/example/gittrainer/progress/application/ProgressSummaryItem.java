package com.example.gittrainer.progress.application;

import com.example.gittrainer.progress.domain.ProgressStatus;

import java.time.Instant;

public record ProgressSummaryItem(
        String scenarioSlug,
        String scenarioTitle,
        ProgressStatus status,
        int attemptCount,
        int completionCount,
        Instant lastActivityAt
) {
}

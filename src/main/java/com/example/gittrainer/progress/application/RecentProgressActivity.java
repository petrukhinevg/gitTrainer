package com.example.gittrainer.progress.application;

import com.example.gittrainer.progress.domain.ProgressStatus;

import java.time.Instant;

public record RecentProgressActivity(
        String scenarioSlug,
        String scenarioTitle,
        ProgressStatus status,
        String eventType,
        Instant happenedAt
) {
}

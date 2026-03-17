package com.example.gittrainer.progress.api;

import java.time.Instant;

public record RecentProgressActivityResponse(
        String scenarioSlug,
        String scenarioTitle,
        String status,
        String eventType,
        Instant happenedAt
) {
}

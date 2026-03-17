package com.example.gittrainer.progress.domain;

import java.time.Instant;

public record ScenarioAttemptStart(
        String scenarioSlug,
        String scenarioTitle,
        String scenarioSource,
        String sessionId,
        Instant startedAt
) {
}

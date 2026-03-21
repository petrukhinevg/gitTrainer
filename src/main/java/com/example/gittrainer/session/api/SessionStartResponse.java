package com.example.gittrainer.session.api;

public record SessionStartResponse(
        String sessionId,
        SessionScenarioResponse scenario,
        SessionLifecycleResponse lifecycle,
        SessionSubmissionBoundaryResponse submission
) {
}

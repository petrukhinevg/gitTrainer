package com.example.gittrainer.session.api;

public record SessionSubmissionResponse(
        String submissionId,
        String sessionId,
        String scenarioSlug,
        int attemptNumber,
        String state,
        PlaceholderOutcome outcome
) {

    public record PlaceholderOutcome(
            String type,
            String code,
            String message
    ) {
    }
}

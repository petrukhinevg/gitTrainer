package com.example.gittrainer.session.api;

import java.time.Instant;
import java.util.List;

public record SessionStartResponse(
        String sessionId,
        SessionScenarioResponse scenario,
        SessionLifecycleResponse lifecycle,
        SessionSubmissionBoundaryResponse submission
) {
}

record SessionScenarioResponse(
        String slug,
        String title,
        String source
) {
}

record SessionLifecycleResponse(
        String status,
        Instant startedAt,
        int submissionCount,
        String lastSubmissionId
) {
}

record SessionSubmissionBoundaryResponse(
        List<String> supportedAnswerTypes,
        SubmissionOutcomeResponse placeholderOutcome
) {
}

record SessionSubmissionResponse(
        String submissionId,
        String sessionId,
        int attemptNumber,
        Instant submittedAt,
        SessionLifecycleResponse lifecycle,
        SubmittedAnswerResponse answer,
        SubmissionOutcomeResponse outcome
) {
}

record SubmittedAnswerResponse(
        String type,
        String value
) {
}

record SubmissionOutcomeResponse(
        String status,
        String correctness,
        String code,
        String message
) {
}

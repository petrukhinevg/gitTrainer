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
        SubmissionOutcomeResponse placeholderOutcome,
        RetryFeedbackResponse placeholderRetryFeedback
) {
}

record SessionSubmissionResponse(
        String submissionId,
        String sessionId,
        int attemptNumber,
        Instant submittedAt,
        SessionLifecycleResponse lifecycle,
        SubmittedAnswerResponse answer,
        SubmissionOutcomeResponse outcome,
        RetryFeedbackResponse retryFeedback
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

record RetryFeedbackResponse(
        String status,
        RetryStateResponse retryState,
        RetryExplanationResponse explanation,
        RetryHintResponse hint
) {
}

record RetryStateResponse(
        String status,
        int attemptNumber,
        String eligibility
) {
}

record RetryExplanationResponse(
        String status,
        String title,
        String tone,
        String message,
        List<String> details
) {
}

record RetryHintResponse(
        String status,
        String level,
        String message,
        List<RetryHintRevealResponse> reveals
) {
}

record RetryHintRevealResponse(
        String id,
        String label,
        String title,
        String message
) {
}

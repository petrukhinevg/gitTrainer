package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.PlaceholderSubmissionOutcome;
import com.example.gittrainer.session.domain.SessionLifecycleState;

public record SubmissionReceipt(
        String submissionId,
        String sessionId,
        String scenarioSlug,
        int attemptNumber,
        SessionLifecycleState state,
        PlaceholderSubmissionOutcome outcome
) {
}

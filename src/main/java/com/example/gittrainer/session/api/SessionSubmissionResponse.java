package com.example.gittrainer.session.api;

import java.time.Instant;

record SessionSubmissionResponse(
        String submissionId,
        String sessionId,
        int attemptNumber,
        Instant submittedAt,
        SessionLifecycleResponse lifecycle,
        SubmittedAnswerResponse answer,
        SubmissionOutcomeResponse outcome,
        SessionTerminalOutputResponse terminalOutput,
        RetryFeedbackResponse retryFeedback,
        SessionWorkspaceResponse workspace
) {
}

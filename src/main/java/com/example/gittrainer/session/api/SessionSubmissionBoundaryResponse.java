package com.example.gittrainer.session.api;

import java.util.List;

record SessionSubmissionBoundaryResponse(
        List<String> supportedAnswerTypes,
        SubmissionOutcomeResponse placeholderOutcome,
        RetryFeedbackResponse placeholderRetryFeedback
) {
}

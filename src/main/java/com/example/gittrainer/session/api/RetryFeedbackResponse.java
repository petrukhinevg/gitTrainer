package com.example.gittrainer.session.api;

record RetryFeedbackResponse(
        String status,
        RetryStateResponse retryState,
        RetryExplanationResponse explanation,
        RetryHintResponse hint
) {
}

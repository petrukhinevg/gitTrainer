package com.example.gittrainer.session.api;

record RetryStateResponse(
        String status,
        int attemptNumber,
        String eligibility
) {
}

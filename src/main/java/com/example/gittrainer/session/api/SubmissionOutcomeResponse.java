package com.example.gittrainer.session.api;

record SubmissionOutcomeResponse(
        String status,
        String correctness,
        String code,
        String message
) {
}

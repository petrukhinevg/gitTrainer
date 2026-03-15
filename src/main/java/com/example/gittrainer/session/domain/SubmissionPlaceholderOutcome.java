package com.example.gittrainer.session.domain;

public record SubmissionPlaceholderOutcome(
        String status,
        String correctness,
        String code,
        String message
) {

    public static SubmissionPlaceholderOutcome boundaryReady() {
        return new SubmissionPlaceholderOutcome(
                "placeholder",
                "not-evaluated",
                "validation-pending",
                "Submission transport is ready, but validation rules are not wired yet."
        );
    }

    public static SubmissionPlaceholderOutcome submissionAccepted() {
        return new SubmissionPlaceholderOutcome(
                "placeholder",
                "not-evaluated",
                "validation-pending",
                "Submission accepted. Placeholder outcome returned until validation rules land."
        );
    }
}

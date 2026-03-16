package com.example.gittrainer.validation.domain;

public record SubmissionOutcome(
        String status,
        String correctness,
        String code,
        String message
) {

    public static SubmissionOutcome boundaryReady() {
        return new SubmissionOutcome(
                "placeholder",
                "not-evaluated",
                "validation-pending",
                "Submission transport is ready, but validation rules are not wired yet."
        );
    }

    public static SubmissionOutcome correct(String code, String message) {
        return new SubmissionOutcome("evaluated", "correct", code, message);
    }

    public static SubmissionOutcome incorrect(String code, String message) {
        return new SubmissionOutcome("evaluated", "incorrect", code, message);
    }

    public static SubmissionOutcome unsupported(String code, String message) {
        return new SubmissionOutcome("evaluated", "unsupported", code, message);
    }
}

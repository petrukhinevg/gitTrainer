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
                "awaiting-first-submission",
                "Session transport and correctness checks are ready. Submit an answer to receive an evaluated result."
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

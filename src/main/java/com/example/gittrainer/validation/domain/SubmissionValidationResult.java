package com.example.gittrainer.validation.domain;

public record SubmissionValidationResult(
        String validatorSpecId,
        String validatorType,
        String runnerKind,
        String runnerStatus,
        long durationMs,
        SubmissionOutcome outcome
) {

    public static SubmissionValidationResult evaluated(
            String validatorSpecId,
            String validatorType,
            String runnerKind,
            long durationMs,
            SubmissionOutcome outcome
    ) {
        return new SubmissionValidationResult(
                validatorSpecId,
                validatorType,
                runnerKind,
                "evaluated",
                durationMs,
                outcome
        );
    }
}

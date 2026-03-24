package com.example.gittrainer.validation.domain;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;

import java.time.Instant;

public record ValidationRunRecord(
        String validationRunId,
        String sessionId,
        String submissionId,
        String scenarioSlug,
        String answerType,
        String answerValue,
        String validatorSpecId,
        String validatorType,
        String runnerKind,
        String runnerStatus,
        String outcomeStatus,
        String outcomeCorrectness,
        String outcomeCode,
        String outcomeMessage,
        long durationMs,
        Instant recordedAt
) {

    public static ValidationRunRecord evaluated(
            String validationRunId,
            String sessionId,
            String submissionId,
            String scenarioSlug,
            SubmittedAnswer answer,
            SubmissionValidationResult validationResult,
            Instant recordedAt
    ) {
        return new ValidationRunRecord(
                validationRunId,
                sessionId,
                submissionId,
                scenarioSlug,
                answer.type(),
                answer.value(),
                validationResult.validatorSpecId(),
                validationResult.validatorType(),
                validationResult.runnerKind(),
                validationResult.runnerStatus(),
                validationResult.outcome().status(),
                validationResult.outcome().correctness(),
                validationResult.outcome().code(),
                validationResult.outcome().message(),
                validationResult.durationMs(),
                recordedAt
        );
    }

    public static ValidationRunRecord runnerFailure(
            String validationRunId,
            String sessionId,
            String submissionId,
            String scenarioSlug,
            SubmittedAnswer answer,
            ValidationRunnerExecutionException exception,
            Instant recordedAt
    ) {
        return new ValidationRunRecord(
                validationRunId,
                sessionId,
                submissionId,
                scenarioSlug,
                answer.type(),
                answer.value(),
                exception.validatorSpecId(),
                exception.validatorType(),
                normalizeRunnerKind(exception.runnerKind()),
                "runner-failed",
                "failed",
                null,
                exception.errorCode(),
                exception.getMessage(),
                exception.durationMs(),
                recordedAt
        );
    }

    private static String normalizeRunnerKind(String runnerKind) {
        if (runnerKind == null || runnerKind.isBlank()) {
            return "validation-runner";
        }
        return runnerKind;
    }
}

package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.CommandTextNormalizer;
import com.example.gittrainer.validation.application.ScenarioValidationEngine;
import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
import com.example.gittrainer.validation.domain.SubmissionOutcome;

import java.util.List;

public final class GitValidationCliHandler {

    private static final long NANOS_PER_MILLISECOND = 1_000_000L;

    private GitValidationCliHandler() {
    }

    public static CliValidationResponse handle(CliValidationRequest request) {
        long startedAt = System.nanoTime();
        if (request == null || request.answer() == null || request.spec() == null) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-request",
                    "CLI validator получил неполный request."
            );
        }
        if (GitRepoStateProbeValidator.supports(request.spec().validatorType())) {
            return GitRepoStateProbeValidator.handle(request).withTiming(elapsedMillis(startedAt));
        }
        if (GitCommandProbeValidator.supports(request.spec().validatorType())) {
            return GitCommandProbeValidator.handle(request).withTiming(elapsedMillis(startedAt));
        }

        SubmissionOutcome outcome = ScenarioValidationEngine.validate(request.spec(), request.answer());
        String normalizedAnswer = CommandTextNormalizer.normalize(request.answer().value());

        return new CliValidationResponse(
                outcome.status(),
                outcome.correctness(),
                outcome.code(),
                outcome.message(),
                List.of(new CliValidationObservation(
                        "normalized-answer",
                        normalizedAnswer
                )),
                List.of(),
                null
        ).withTiming(elapsedMillis(startedAt));
    }

    private static long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / NANOS_PER_MILLISECOND;
    }
}

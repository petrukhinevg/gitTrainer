package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.CommandTextNormalizer;
import com.example.gittrainer.validation.application.ScenarioValidationEngine;
import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
import com.example.gittrainer.validation.domain.SubmissionOutcome;

import java.util.List;

public final class GitValidationCliHandler {

    private GitValidationCliHandler() {
    }

    public static CliValidationResponse handle(CliValidationRequest request) {
        if (request == null || request.answer() == null || request.spec() == null) {
            throw new ValidationRunnerExecutionException(
                    "validation-runner-invalid-request",
                    "CLI validator получил неполный request."
            );
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
                List.of()
        );
    }
}

package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.validation.application.ScenarioValidationEngine;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.example.gittrainer.validation.cli.CliValidationObservation;
import com.example.gittrainer.validation.cli.CliValidationRequest;
import com.example.gittrainer.validation.cli.CliValidationResponse;
import com.example.gittrainer.validation.cli.GitValidationCliHandler;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import com.example.gittrainer.validation.domain.SubmissionTerminalOutput;

import java.util.List;

final class ValidationOutcomeMapper {

    private ValidationOutcomeMapper() {
    }

    static ValidationOutcomeDetails details(ScenarioValidationSpec spec, CliValidationRequest request) {
        if (!GitValidationCliHandler.supports(spec.validatorType())) {
            return new ValidationOutcomeDetails(
                    ScenarioValidationEngine.validate(spec, request.answer()),
                    null
            );
        }

        CliValidationResponse response = GitValidationCliHandler.handle(request);
        return new ValidationOutcomeDetails(
                new SubmissionOutcome(
                        response.status(),
                        response.correctness(),
                        response.code(),
                        response.message()
                ),
                toTerminalOutput(response.observations())
        );
    }

    private static SubmissionTerminalOutput toTerminalOutput(List<CliValidationObservation> observations) {
        if (observations == null || observations.isEmpty()) {
            return null;
        }

        String stdout = null;
        String stderr = null;
        for (CliValidationObservation observation : observations) {
            if (observation == null || observation.code() == null) {
                continue;
            }
            if ("stdout".equals(observation.code())) {
                stdout = observation.message();
            }
            if ("stderr".equals(observation.code())) {
                stderr = observation.message();
            }
        }

        SubmissionTerminalOutput terminalOutput = new SubmissionTerminalOutput(stdout, stderr);
        return terminalOutput.hasContent() ? terminalOutput : null;
    }

    record ValidationOutcomeDetails(
            SubmissionOutcome outcome,
            SubmissionTerminalOutput terminalOutput
    ) {
    }
}

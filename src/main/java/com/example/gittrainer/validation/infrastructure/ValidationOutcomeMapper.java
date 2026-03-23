package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.validation.application.ScenarioValidationEngine;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.example.gittrainer.validation.cli.CliValidationRequest;
import com.example.gittrainer.validation.cli.CliValidationResponse;
import com.example.gittrainer.validation.cli.GitValidationCliHandler;
import com.example.gittrainer.validation.domain.SubmissionOutcome;

final class ValidationOutcomeMapper {

    private ValidationOutcomeMapper() {
    }

    static SubmissionOutcome outcome(ScenarioValidationSpec spec, CliValidationRequest request) {
        if (!GitValidationCliHandler.supports(spec.validatorType())) {
            return ScenarioValidationEngine.validate(spec, request.answer());
        }

        CliValidationResponse response = GitValidationCliHandler.handle(request);
        return new SubmissionOutcome(
                response.status(),
                response.correctness(),
                response.code(),
                response.message()
        );
    }
}

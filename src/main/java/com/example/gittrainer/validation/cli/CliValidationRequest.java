package com.example.gittrainer.validation.cli;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;

public record CliValidationRequest(
        String scenarioSlug,
        SubmittedAnswer answer,
        ScenarioValidationSpec spec
) {
}

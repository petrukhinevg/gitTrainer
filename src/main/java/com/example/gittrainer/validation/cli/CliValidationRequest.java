package com.example.gittrainer.validation.cli;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;

import java.util.List;

public record CliValidationRequest(
        String scenarioSlug,
        List<SubmittedAnswer> priorAnswers,
        SubmittedAnswer answer,
        ScenarioValidationSpec spec,
        String workspacePath
) {

    public CliValidationRequest(String scenarioSlug, SubmittedAnswer answer, ScenarioValidationSpec spec) {
        this(scenarioSlug, List.of(), answer, spec, null);
    }

    public CliValidationRequest(
            String scenarioSlug,
            List<SubmittedAnswer> priorAnswers,
            SubmittedAnswer answer,
            ScenarioValidationSpec spec
    ) {
        this(scenarioSlug, priorAnswers, answer, spec, null);
    }

    public CliValidationRequest {
        priorAnswers = priorAnswers == null ? List.of() : List.copyOf(priorAnswers);
        workspacePath = workspacePath == null || workspacePath.isBlank() ? null : workspacePath.trim();
    }
}

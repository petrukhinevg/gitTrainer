package com.example.gittrainer.validation.application;

import java.util.List;

public record ScenarioValidationSpec(
        String scenarioSlug,
        String answerType,
        String validatorType,
        List<ScenarioValidationRule> rules
) {
}

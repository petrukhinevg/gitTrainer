package com.example.gittrainer.validation.application;

import java.util.List;

public record ScenarioValidationSpec(
        String specId,
        String scenarioSlug,
        String answerType,
        String validatorType,
        long timeoutMs,
        List<ScenarioValidationRule> rules
) {
}

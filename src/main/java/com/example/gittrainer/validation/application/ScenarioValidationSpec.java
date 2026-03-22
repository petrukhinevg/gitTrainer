package com.example.gittrainer.validation.application;

import java.util.List;

public record ScenarioValidationSpec(
        String specId,
        String scenarioSlug,
        String answerType,
        String validatorType,
        long timeoutMs,
        java.util.Map<String, Object> config,
        List<ScenarioValidationRule> rules
) {
}

package com.example.gittrainer.validation.application;

public record ScenarioValidationRule(
        String normalizedAnswerValue,
        String correctness,
        String code,
        String message
) {
}

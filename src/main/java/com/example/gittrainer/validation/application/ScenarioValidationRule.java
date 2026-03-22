package com.example.gittrainer.validation.application;

public record ScenarioValidationRule(
        String matchType,
        String rawMatchValue,
        String normalizedAnswerValue,
        String correctness,
        String code,
        String message
) {
}

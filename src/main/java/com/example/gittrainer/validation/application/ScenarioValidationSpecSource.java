package com.example.gittrainer.validation.application;

import java.util.Optional;

public interface ScenarioValidationSpecSource {

    Optional<ScenarioValidationSpec> findSpec(String scenarioSlug, String answerType);
}

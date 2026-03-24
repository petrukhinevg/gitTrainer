package com.example.gittrainer.scenario.application;

public class ScenarioTaskContentMissingException extends RuntimeException {

    public ScenarioTaskContentMissingException(String scenarioSlug) {
        super("Описание задания не подготовлено для сценария: %s".formatted(scenarioSlug));
    }
}

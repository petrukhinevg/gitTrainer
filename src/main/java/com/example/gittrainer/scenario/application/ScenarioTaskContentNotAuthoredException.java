package com.example.gittrainer.scenario.application;

public class ScenarioTaskContentNotAuthoredException extends RuntimeException {

    public ScenarioTaskContentNotAuthoredException(String scenarioSlug) {
        super("Описание задания не подготовлено для сценария: %s".formatted(scenarioSlug));
    }
}

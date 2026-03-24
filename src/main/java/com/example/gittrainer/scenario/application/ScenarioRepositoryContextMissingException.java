package com.example.gittrainer.scenario.application;

public class ScenarioRepositoryContextMissingException extends RuntimeException {

    public ScenarioRepositoryContextMissingException(String scenarioSlug) {
        super("Контекст репозитория не подготовлен для сценария: %s".formatted(scenarioSlug));
    }
}

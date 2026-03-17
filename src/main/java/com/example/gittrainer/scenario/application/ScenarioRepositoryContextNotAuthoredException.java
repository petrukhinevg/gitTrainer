package com.example.gittrainer.scenario.application;

public class ScenarioRepositoryContextNotAuthoredException extends RuntimeException {

    public ScenarioRepositoryContextNotAuthoredException(String scenarioSlug) {
        super("Контекст репозитория не подготовлен для сценария: %s".formatted(scenarioSlug));
    }
}

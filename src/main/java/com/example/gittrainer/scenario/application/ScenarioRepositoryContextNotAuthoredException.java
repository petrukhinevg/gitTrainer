package com.example.gittrainer.scenario.application;

public class ScenarioRepositoryContextNotAuthoredException extends RuntimeException {

    public ScenarioRepositoryContextNotAuthoredException(String scenarioSlug) {
        super("Контекст репозитория недоступен для slug: %s".formatted(scenarioSlug));
    }
}

package com.example.gittrainer.scenario.application;

public class ScenarioRepositoryContextNotAuthoredException extends RuntimeException {

    public ScenarioRepositoryContextNotAuthoredException(String scenarioSlug) {
        super("Repository context is unavailable for slug: %s".formatted(scenarioSlug));
    }
}

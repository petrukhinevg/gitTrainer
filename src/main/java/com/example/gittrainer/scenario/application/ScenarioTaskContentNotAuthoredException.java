package com.example.gittrainer.scenario.application;

public class ScenarioTaskContentNotAuthoredException extends RuntimeException {

    public ScenarioTaskContentNotAuthoredException(String scenarioSlug) {
        super("Task content is unavailable for slug: %s".formatted(scenarioSlug));
    }
}

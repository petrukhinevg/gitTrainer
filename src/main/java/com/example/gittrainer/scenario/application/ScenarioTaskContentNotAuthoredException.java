package com.example.gittrainer.scenario.application;

public class ScenarioTaskContentNotAuthoredException extends RuntimeException {

    public ScenarioTaskContentNotAuthoredException(String scenarioSlug) {
        super("Контент задания недоступен для slug: %s".formatted(scenarioSlug));
    }
}

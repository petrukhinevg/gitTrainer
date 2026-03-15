package com.example.gittrainer.scenario.application;

public class ScenarioDetailNotFoundException extends RuntimeException {

    public ScenarioDetailNotFoundException(String slug) {
        super("Scenario detail is unavailable for slug: " + slug);
    }
}

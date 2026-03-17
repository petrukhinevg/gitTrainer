package com.example.gittrainer.scenario.application;

public class ScenarioDetailNotFoundException extends RuntimeException {

    public ScenarioDetailNotFoundException(String slug) {
        super("Детали сценария недоступны для slug: " + slug);
    }
}

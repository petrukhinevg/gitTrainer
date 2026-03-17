package com.example.gittrainer.scenario.application;

public class ScenarioDetailNotFoundException extends RuntimeException {

    public ScenarioDetailNotFoundException(String slug) {
        super("Сценарий не найден: " + slug);
    }
}

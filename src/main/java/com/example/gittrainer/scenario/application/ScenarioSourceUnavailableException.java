package com.example.gittrainer.scenario.application;

public class ScenarioSourceUnavailableException extends RuntimeException {

    private final String sourceName;

    public ScenarioSourceUnavailableException(String sourceName, String message) {
        super(message);
        this.sourceName = sourceName;
    }

    public String sourceName() {
        return sourceName;
    }
}

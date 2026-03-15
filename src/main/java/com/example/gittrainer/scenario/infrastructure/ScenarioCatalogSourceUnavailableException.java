package com.example.gittrainer.scenario.infrastructure;

public class ScenarioCatalogSourceUnavailableException extends RuntimeException {

    private final String sourceName;

    public ScenarioCatalogSourceUnavailableException(String sourceName, String message) {
        super(message);
        this.sourceName = sourceName;
    }

    public String sourceName() {
        return sourceName;
    }
}

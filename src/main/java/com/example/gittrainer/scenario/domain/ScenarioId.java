package com.example.gittrainer.scenario.domain;

public record ScenarioId(String value) {

    public ScenarioId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("scenario id must not be blank");
        }
    }
}

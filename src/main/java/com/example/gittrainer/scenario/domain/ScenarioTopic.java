package com.example.gittrainer.scenario.domain;

public record ScenarioTopic(String value) {

    public ScenarioTopic {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("scenario topic must not be blank");
        }
    }
}

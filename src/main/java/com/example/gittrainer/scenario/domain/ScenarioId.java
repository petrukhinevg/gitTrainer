package com.example.gittrainer.scenario.domain;

public record ScenarioId(String value) {

    public ScenarioId {
        value = ScenarioText.requireTrimmed(value, "scenario id");
    }
}

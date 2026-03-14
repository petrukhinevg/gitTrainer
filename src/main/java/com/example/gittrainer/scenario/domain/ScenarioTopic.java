package com.example.gittrainer.scenario.domain;

public record ScenarioTopic(String value) {

    public ScenarioTopic {
        value = ScenarioText.requireTrimmed(value, "scenario topic");
    }
}

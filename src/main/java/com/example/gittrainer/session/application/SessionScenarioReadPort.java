package com.example.gittrainer.session.application;

public interface SessionScenarioReadPort {

    SessionScenarioSnapshot loadForSessionStart(String scenarioSlug, String source);
}

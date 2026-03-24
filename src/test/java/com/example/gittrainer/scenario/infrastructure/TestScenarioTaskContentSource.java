package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.application.ScenarioTaskContentGateway;
import com.example.gittrainer.scenario.application.ScenarioTaskContentNotAuthoredException;
import org.springframework.stereotype.Component;

@Component
public class TestScenarioTaskContentSource implements ScenarioTaskContentGateway {

    private final AuthoredScenarioResourceLoader resourceLoader;

    public TestScenarioTaskContentSource(AuthoredScenarioResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Override
    public ScenarioTaskContent loadTaskContent(String scenarioSlug) {
        try {
            return resourceLoader.taskContent(scenarioSlug);
        } catch (IllegalArgumentException exception) {
            throw new ScenarioTaskContentNotAuthoredException(scenarioSlug);
        }
    }
}

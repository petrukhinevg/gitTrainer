package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.application.ScenarioTaskContentGateway;
import com.example.gittrainer.scenario.application.ScenarioTaskContentMissingException;
import org.springframework.stereotype.Component;

@Component
public class SeedScenarioTaskContentSource implements ScenarioTaskContentGateway {

    private final SeedScenarioResourceLoader resourceLoader;

    public SeedScenarioTaskContentSource(SeedScenarioResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Override
    public ScenarioTaskContent loadTaskContent(String scenarioSlug) {
        try {
            return resourceLoader.taskContent(scenarioSlug);
        } catch (IllegalArgumentException exception) {
            throw new ScenarioTaskContentMissingException(scenarioSlug);
        }
    }
}

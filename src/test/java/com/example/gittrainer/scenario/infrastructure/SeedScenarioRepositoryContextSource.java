package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioRepositoryContextGateway;
import com.example.gittrainer.scenario.application.ScenarioRepositoryContextMissingException;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.springframework.stereotype.Component;

@Component
public class SeedScenarioRepositoryContextSource implements ScenarioRepositoryContextGateway {

    private final SeedScenarioResourceLoader resourceLoader;

    public SeedScenarioRepositoryContextSource(SeedScenarioResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Override
    public ScenarioWorkspaceDetail.ScenarioRepositoryContext loadRepositoryContext(String scenarioSlug) {
        try {
            return resourceLoader.repositoryContext(scenarioSlug);
        } catch (IllegalArgumentException exception) {
            throw new ScenarioRepositoryContextMissingException(scenarioSlug);
        }
    }
}

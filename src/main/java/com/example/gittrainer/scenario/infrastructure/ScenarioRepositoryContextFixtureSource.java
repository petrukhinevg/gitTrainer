package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioRepositoryContextGateway;
import com.example.gittrainer.scenario.application.ScenarioRepositoryContextNotAuthoredException;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.springframework.stereotype.Component;

@Component
public class ScenarioRepositoryContextFixtureSource implements ScenarioRepositoryContextGateway {

    private final AuthoredScenarioResourceLoader resourceLoader;

    public ScenarioRepositoryContextFixtureSource(AuthoredScenarioResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Override
    public ScenarioWorkspaceDetail.ScenarioRepositoryContext loadRepositoryContext(String scenarioSlug) {
        try {
            return resourceLoader.repositoryContext(scenarioSlug);
        } catch (IllegalArgumentException exception) {
            throw new ScenarioRepositoryContextNotAuthoredException(scenarioSlug);
        }
    }
}

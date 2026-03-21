package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;

public interface ScenarioRepositoryContextGateway {

    ScenarioWorkspaceDetail.ScenarioRepositoryContext loadRepositoryContext(String scenarioSlug);
}

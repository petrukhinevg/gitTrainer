package com.example.gittrainer.scenario.api;

record ScenarioWorkspaceResponse(
        ScenarioWorkspaceShellResponse shell,
        ScenarioTaskPreviewResponse task,
        ScenarioRepositoryContextResponse repositoryContext
) {
}

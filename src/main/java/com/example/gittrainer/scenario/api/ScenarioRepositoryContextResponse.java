package com.example.gittrainer.scenario.api;

import java.util.List;

record ScenarioRepositoryContextResponse(
        String status,
        List<ScenarioRepositoryBranchResponse> branches,
        List<ScenarioRepositoryCommitResponse> commits,
        List<ScenarioRepositoryFileResponse> files,
        List<ScenarioWorkspaceAnnotationResponse> annotations
) {
}

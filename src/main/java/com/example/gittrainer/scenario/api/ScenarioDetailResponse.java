package com.example.gittrainer.scenario.api;

import java.util.List;

public record ScenarioDetailResponse(
        String id,
        String slug,
        String title,
        String summary,
        String difficulty,
        List<String> tags,
        ScenarioDetailMetaResponse meta,
        ScenarioWorkspaceResponse workspace
) {
}

record ScenarioDetailMetaResponse(
        String source,
        boolean stub
) {
}

record ScenarioWorkspaceResponse(
        ScenarioWorkspaceShellResponse shell,
        ScenarioTaskPreviewResponse task,
        ScenarioRepositoryContextResponse repositoryContext
) {
}

record ScenarioWorkspaceShellResponse(
        String leftPanelTitle,
        String centerPanelTitle,
        String rightPanelTitle
) {
}

record ScenarioTaskPreviewResponse(
        String status,
        String goal,
        List<String> instructions,
        List<String> steps
) {
}

record ScenarioRepositoryContextResponse(
        String status,
        List<ScenarioRepositoryBranchResponse> branches,
        List<ScenarioRepositoryCommitResponse> commits,
        List<ScenarioRepositoryFileResponse> files,
        List<ScenarioWorkspaceAnnotationResponse> annotations
) {
}

record ScenarioRepositoryBranchResponse(
        String name,
        boolean current
) {
}

record ScenarioRepositoryCommitResponse(
        String id,
        String summary
) {
}

record ScenarioRepositoryFileResponse(
        String path,
        String status
) {
}

record ScenarioWorkspaceAnnotationResponse(
        String label,
        String message
) {
}

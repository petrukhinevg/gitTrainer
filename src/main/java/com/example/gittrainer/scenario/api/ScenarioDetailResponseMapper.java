package com.example.gittrainer.scenario.api;

import com.example.gittrainer.scenario.application.ScenarioDetailResult;
import com.example.gittrainer.scenario.domain.ScenarioDifficulty;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.springframework.stereotype.Component;

@Component
public class ScenarioDetailResponseMapper {

    public ScenarioDetailResponse toResponse(ScenarioDetailResult result) {
        ScenarioWorkspaceDetail detail = result.detail();
        return new ScenarioDetailResponse(
                detail.id(),
                detail.slug(),
                detail.title(),
                detail.summary(),
                toWireDifficulty(detail.difficulty()),
                detail.tags(),
                new ScenarioDetailMetaResponse(result.source(), result.stub()),
                new ScenarioWorkspaceResponse(
                        new ScenarioWorkspaceShellResponse(
                                detail.shell().leftPanelTitle(),
                                detail.shell().centerPanelTitle(),
                                detail.shell().rightPanelTitle()
                        ),
                        new ScenarioTaskPreviewResponse(
                                detail.task().status(),
                                detail.task().goal(),
                                detail.task().instructions(),
                                detail.task().steps()
                        ),
                        new ScenarioRepositoryContextResponse(
                                detail.repositoryContext().status(),
                                detail.repositoryContext().branches().stream()
                                        .map(branch -> new ScenarioRepositoryBranchResponse(branch.name(), branch.current()))
                                        .toList(),
                                detail.repositoryContext().commits().stream()
                                        .map(commit -> new ScenarioRepositoryCommitResponse(commit.id(), commit.summary()))
                                        .toList(),
                                detail.repositoryContext().files().stream()
                                        .map(file -> new ScenarioRepositoryFileResponse(file.path(), file.status()))
                                        .toList(),
                                detail.repositoryContext().annotations().stream()
                                        .map(annotation -> new ScenarioWorkspaceAnnotationResponse(annotation.label(), annotation.message()))
                                        .toList()
                        )
                )
        );
    }

    private String toWireDifficulty(ScenarioDifficulty difficulty) {
        return switch (difficulty) {
            case BEGINNER -> "beginner";
            case INTERMEDIATE -> "intermediate";
        };
    }
}

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
                                detail.task().instructions().stream()
                                        .map(instruction -> new ScenarioTaskInstructionResponse(
                                                instruction.id(),
                                                instruction.text()
                                        ))
                                        .toList(),
                                detail.task().steps().stream()
                                        .map(step -> new ScenarioTaskStepResponse(
                                                step.position(),
                                                step.title(),
                                                step.detail()
                                        ))
                                        .toList(),
                                detail.task().annotations().stream()
                                        .map(annotation -> new ScenarioTaskAnnotationResponse(
                                                annotation.label(),
                                                annotation.message()
                                        ))
                                        .toList()
                        ),
                        new ScenarioRepositoryContextResponse(
                                detail.repositoryContext().status(),
                                detail.repositoryContext().branches().stream()
                                        .map(branch -> new ScenarioRepositoryBranchResponse(
                                                branch.name(),
                                                branch.current()
                                        ))
                                        .toList(),
                                detail.repositoryContext().commits().stream()
                                        .map(commit -> new ScenarioRepositoryCommitResponse(
                                                commit.id(),
                                                commit.summary()
                                        ))
                                        .toList(),
                                detail.repositoryContext().files().stream()
                                        .map(file -> new ScenarioRepositoryFileResponse(
                                                file.path(),
                                                file.status()
                                        ))
                                        .toList(),
                                detail.repositoryContext().annotations().stream()
                                        .map(annotation -> new ScenarioWorkspaceAnnotationResponse(
                                                annotation.label(),
                                                annotation.message()
                                        ))
                                        .toList(),
                                toCommitGraphResponse(detail.repositoryContext())
                        )
                )
        );
    }

    private ScenarioCommitGraphResponse toCommitGraphResponse(ScenarioWorkspaceDetail.ScenarioRepositoryContext context) {
        ScenarioWorkspaceDetail.ScenarioCommitGraph graph = context.graph() != null
                ? context.graph()
                : synthesizeGraph(context);
        return new ScenarioCommitGraphResponse(
                graph.nodes().stream()
                        .map(node -> new ScenarioCommitNodeResponse(
                                node.id(),
                                node.summary(),
                                node.parentIds(),
                                node.refs().stream()
                                        .map(ref -> new ScenarioCommitRefResponse(
                                                ref.name(),
                                                ref.type(),
                                                ref.current()
                                        ))
                                        .toList()
                        ))
                        .toList()
        );
    }

    private ScenarioWorkspaceDetail.ScenarioCommitGraph synthesizeGraph(
            ScenarioWorkspaceDetail.ScenarioRepositoryContext context
    ) {
        java.util.List<ScenarioWorkspaceDetail.ScenarioRepositoryCommit> commits = context.commits();
        if (commits.isEmpty()) {
            return new ScenarioWorkspaceDetail.ScenarioCommitGraph(java.util.List.of());
        }

        java.util.List<ScenarioWorkspaceDetail.ScenarioCommitNode> nodes = new java.util.ArrayList<>();
        for (int index = 0; index < commits.size(); index++) {
            ScenarioWorkspaceDetail.ScenarioRepositoryCommit commit = commits.get(index);
            java.util.List<String> parentIds = index + 1 < commits.size()
                    ? java.util.List.of(commits.get(index + 1).id())
                    : java.util.List.of();
            java.util.List<ScenarioWorkspaceDetail.ScenarioCommitRef> refs = index == 0
                    ? context.branches().stream()
                            .map(branch -> new ScenarioWorkspaceDetail.ScenarioCommitRef(
                                    branch.name(),
                                    branch.name().contains("/") && branch.name().startsWith("origin/")
                                            ? "remote"
                                            : "branch",
                                    branch.current()
                            ))
                            .toList()
                    : java.util.List.of();
            nodes.add(new ScenarioWorkspaceDetail.ScenarioCommitNode(
                    commit.id(),
                    commit.summary(),
                    parentIds,
                    refs
            ));
        }
        return new ScenarioWorkspaceDetail.ScenarioCommitGraph(nodes);
    }

    private String toWireDifficulty(ScenarioDifficulty difficulty) {
        return switch (difficulty) {
            case BEGINNER -> "beginner";
            case INTERMEDIATE -> "intermediate";
        };
    }
}

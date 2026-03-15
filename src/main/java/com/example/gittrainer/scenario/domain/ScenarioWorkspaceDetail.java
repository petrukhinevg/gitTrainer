package com.example.gittrainer.scenario.domain;

import java.util.List;

public record ScenarioWorkspaceDetail(
        String id,
        String slug,
        String title,
        String summary,
        ScenarioDifficulty difficulty,
        List<String> tags,
        ScenarioWorkspaceShell shell,
        ScenarioTaskPreview task,
        ScenarioRepositoryContext repositoryContext
) {

    public ScenarioWorkspaceDetail {
        tags = tags == null ? List.of() : List.copyOf(tags);
    }

    public record ScenarioWorkspaceShell(
            String leftPanelTitle,
            String centerPanelTitle,
            String rightPanelTitle
    ) {
    }

    public record ScenarioTaskPreview(
            String status,
            String goal,
            List<ScenarioTaskInstruction> instructions,
            List<ScenarioTaskStep> steps,
            List<ScenarioTaskAnnotation> annotations
    ) {
        public ScenarioTaskPreview {
            instructions = instructions == null ? List.of() : List.copyOf(instructions);
            steps = steps == null ? List.of() : List.copyOf(steps);
            annotations = annotations == null ? List.of() : List.copyOf(annotations);
        }
    }

    public record ScenarioTaskInstruction(
            String id,
            String text
    ) {
    }

    public record ScenarioTaskStep(
            int position,
            String title,
            String detail
    ) {
    }

    public record ScenarioTaskAnnotation(
            String label,
            String message
    ) {
    }

    public record ScenarioRepositoryContext(
            String status,
            List<ScenarioRepositoryBranch> branches,
            List<ScenarioRepositoryCommit> commits,
            List<ScenarioRepositoryFile> files,
            List<ScenarioWorkspaceAnnotation> annotations
    ) {
        public ScenarioRepositoryContext {
            branches = branches == null ? List.of() : List.copyOf(branches);
            commits = commits == null ? List.of() : List.copyOf(commits);
            files = files == null ? List.of() : List.copyOf(files);
            annotations = annotations == null ? List.of() : List.copyOf(annotations);
        }
    }

    public record ScenarioRepositoryBranch(String name, boolean current) {
    }

    public record ScenarioRepositoryCommit(String id, String summary) {
    }

    public record ScenarioRepositoryFile(String path, String status) {
    }

    public record ScenarioWorkspaceAnnotation(String label, String message) {
    }
}

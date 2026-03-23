package com.example.gittrainer.validation.cli;

import com.example.gittrainer.validation.application.ScenarioValidationSpec;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public final class GitScenarioWorkspaceFactory {

    private static final String GIT_COMMAND_PROBE = "git_command_probe";
    private static final String GIT_REPO_STATE_PROBE = "git_repo_state_probe";
    private static final String WORKSPACE_DIRECTORY = "workspace";

    private GitScenarioWorkspaceFactory() {
    }

    public static Path prepareWorkspace(Path sessionRoot, ScenarioValidationSpec spec)
            throws IOException, InterruptedException {
        if (spec == null || spec.validatorType() == null) {
            Path workspacePath = workspacePath(sessionRoot);
            Files.createDirectories(workspacePath);
            return workspacePath;
        }

        return switch (spec.validatorType()) {
            case GIT_COMMAND_PROBE -> prepareCommandProbeWorkspace(sessionRoot, spec);
            case GIT_REPO_STATE_PROBE -> prepareRepoStateProbeWorkspace(sessionRoot, spec);
            default -> {
                Path workspacePath = workspacePath(sessionRoot);
                Files.createDirectories(workspacePath);
                yield workspacePath;
            }
        };
    }

    public static Path workspacePath(Path sessionRoot) {
        return sessionRoot.resolve(WORKSPACE_DIRECTORY).normalize();
    }

    private static Path prepareCommandProbeWorkspace(Path sessionRoot, ScenarioValidationSpec spec)
            throws IOException, InterruptedException {
        Path workspacePath = workspacePath(sessionRoot);
        Files.createDirectories(workspacePath);
        GitCommandProbeValidator.prepareWorkspace(
                workspacePath,
                GitCommandProbeConfig.from(spec.config()).workspaceTemplate()
        );
        return workspacePath;
    }

    private static Path prepareRepoStateProbeWorkspace(Path sessionRoot, ScenarioValidationSpec spec)
            throws IOException, InterruptedException {
        Files.createDirectories(sessionRoot);
        return GitRepoStateProbeValidator.prepareWorkspace(
                sessionRoot,
                GitRepoStateProbeConfig.from(spec.config()).workspaceTemplate()
        );
    }
}

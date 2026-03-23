package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.SessionWorkspaceManager;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.example.gittrainer.validation.application.ScenarioValidationSpecSource;
import com.example.gittrainer.validation.application.ValidationRunnerExecutionException;
import com.example.gittrainer.validation.cli.GitScenarioWorkspaceFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

@Component
public class FilesystemSessionWorkspaceManager implements SessionWorkspaceManager {

    private final Path workspaceRoot;
    private final ScenarioValidationSpecSource specSource;

    public FilesystemSessionWorkspaceManager(
            @Value("${gittrainer.session.workspace-root:${user.dir}/build/gittrainer-session-workspaces}") String workspaceRoot,
            ScenarioValidationSpecSource specSource
    ) {
        this.workspaceRoot = Path.of(workspaceRoot).toAbsolutePath().normalize();
        this.specSource = specSource;
    }

    @Override
    public void initializeWorkspace(String sessionId, String scenarioSlug) {
        Path sessionRoot = sessionRoot(sessionId);
        try {
            deleteRecursively(sessionRoot);
            Files.createDirectories(sessionRoot);
            ScenarioValidationSpec spec = specSource.findSpec(scenarioSlug, "command_text").orElse(null);
            GitScenarioWorkspaceFactory.prepareWorkspace(sessionRoot, spec);
        } catch (IOException | InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ValidationRunnerExecutionException(
                    "validation-runner-workspace-setup-failed",
                    "Не удалось подготовить workspace для session-backed сценария.",
                    exception
            );
        }
    }

    @Override
    public Optional<Path> resolveWorkspacePath(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return Optional.empty();
        }
        Path workspacePath = GitScenarioWorkspaceFactory.workspacePath(sessionRoot(sessionId));
        return Files.isDirectory(workspacePath) ? Optional.of(workspacePath) : Optional.empty();
    }

    private Path sessionRoot(String sessionId) {
        return workspaceRoot.resolve(sessionId).normalize();
    }

    private void deleteRecursively(Path root) throws IOException {
        if (root == null || !Files.exists(root)) {
            return;
        }
        try (var paths = Files.walk(root)) {
            paths.sorted((left, right) -> right.compareTo(left))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException exception) {
                            throw new IllegalStateException(exception);
                        }
                    });
        } catch (IllegalStateException exception) {
            if (exception.getCause() instanceof IOException ioException) {
                throw ioException;
            }
            throw exception;
        }
    }
}

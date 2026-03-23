package com.example.gittrainer.session.application;

import java.nio.file.Path;
import java.util.Optional;

public interface SessionWorkspaceManager {

    void initializeWorkspace(String sessionId, String scenarioSlug);

    Optional<Path> resolveWorkspacePath(String sessionId);
}

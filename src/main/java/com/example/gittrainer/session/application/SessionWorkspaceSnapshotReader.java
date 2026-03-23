package com.example.gittrainer.session.application;

import java.util.Optional;

public interface SessionWorkspaceSnapshotReader {

    Optional<SessionWorkspaceSnapshot> read(String sessionId);
}

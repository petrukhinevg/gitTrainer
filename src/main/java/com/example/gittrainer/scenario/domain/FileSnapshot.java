package com.example.gittrainer.scenario.domain;

import java.util.Objects;

public record FileSnapshot(
        String path,
        FileState state
) {

    public FileSnapshot {
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("file path must not be blank");
        }
        state = Objects.requireNonNull(state, "file state must not be null");
    }
}

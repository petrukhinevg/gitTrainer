package com.example.gittrainer.scenario.domain;

import java.util.List;
import java.util.Objects;

public record CommitSnapshot(
        String id,
        String message,
        List<String> parentCommitIds
) {

    public CommitSnapshot {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("commit id must not be blank");
        }
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("commit message must not be blank");
        }
        parentCommitIds = List.copyOf(Objects.requireNonNull(parentCommitIds, "parentCommitIds must not be null"));
        if (parentCommitIds.stream().anyMatch(parentId -> parentId == null || parentId.isBlank())) {
            throw new IllegalArgumentException("parentCommitIds must not contain blank values");
        }
    }
}

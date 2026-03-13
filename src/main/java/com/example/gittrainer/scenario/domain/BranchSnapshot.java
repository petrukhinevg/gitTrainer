package com.example.gittrainer.scenario.domain;

public record BranchSnapshot(
        String name,
        String headCommitId,
        boolean current
) {

    public BranchSnapshot {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("branch name must not be blank");
        }
        if (headCommitId == null || headCommitId.isBlank()) {
            throw new IllegalArgumentException("branch headCommitId must not be blank");
        }
    }
}

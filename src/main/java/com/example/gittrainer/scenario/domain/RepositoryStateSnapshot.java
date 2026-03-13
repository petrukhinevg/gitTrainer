package com.example.gittrainer.scenario.domain;

import java.util.List;
import java.util.Objects;

public record RepositoryStateSnapshot(
        List<BranchSnapshot> branches,
        List<CommitSnapshot> commits,
        List<FileSnapshot> files
) {

    public RepositoryStateSnapshot {
        branches = List.copyOf(Objects.requireNonNull(branches, "branches must not be null"));
        commits = List.copyOf(Objects.requireNonNull(commits, "commits must not be null"));
        files = List.copyOf(Objects.requireNonNull(files, "files must not be null"));

        if (branches.isEmpty() && commits.isEmpty() && files.isEmpty()) {
            throw new IllegalArgumentException("repository snapshot must describe at least one repository signal");
        }

        long currentBranchCount = branches.stream()
                .filter(BranchSnapshot::current)
                .count();
        if (currentBranchCount > 1) {
            throw new IllegalArgumentException("repository snapshot must not contain more than one current branch");
        }
    }
}

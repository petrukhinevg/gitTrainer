package com.example.gittrainer.session.application;

import java.util.List;

public record SessionWorkspaceSnapshot(
        RepositoryContext repositoryContext
) {

    public record RepositoryContext(
            String status,
            List<Branch> branches,
            List<Commit> commits,
            List<FileEntry> files,
            List<Annotation> annotations
    ) {

        public RepositoryContext {
            branches = branches == null ? List.of() : List.copyOf(branches);
            commits = commits == null ? List.of() : List.copyOf(commits);
            files = files == null ? List.of() : List.copyOf(files);
            annotations = annotations == null ? List.of() : List.copyOf(annotations);
        }
    }

    public record Branch(
            String name,
            boolean current
    ) {
    }

    public record Commit(
            String id,
            String summary
    ) {
    }

    public record FileEntry(
            String path,
            String status
    ) {
    }

    public record Annotation(
            String label,
            String message
    ) {
    }
}

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
            List<Annotation> annotations,
            CommitGraph graph
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

    public record CommitGraph(
            List<CommitNode> nodes
    ) {
        public CommitGraph {
            nodes = nodes == null ? List.of() : List.copyOf(nodes);
        }
    }

    public record CommitNode(
            String id,
            String summary,
            List<String> parentIds,
            List<CommitRef> refs
    ) {
        public CommitNode {
            parentIds = parentIds == null ? List.of() : List.copyOf(parentIds);
            refs = refs == null ? List.of() : List.copyOf(refs);
        }
    }

    public record CommitRef(
            String name,
            String type,
            boolean current
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

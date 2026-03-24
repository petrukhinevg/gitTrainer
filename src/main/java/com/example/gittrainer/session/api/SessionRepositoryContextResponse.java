package com.example.gittrainer.session.api;

import java.util.List;

record SessionRepositoryContextResponse(
        String status,
        List<SessionRepositoryBranchResponse> branches,
        List<SessionRepositoryCommitResponse> commits,
        List<SessionRepositoryFileResponse> files,
        List<SessionWorkspaceAnnotationResponse> annotations,
        SessionCommitGraphResponse graph
) {
}

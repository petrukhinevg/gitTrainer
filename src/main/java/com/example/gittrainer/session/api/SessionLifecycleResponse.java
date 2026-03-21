package com.example.gittrainer.session.api;

import java.time.Instant;

record SessionLifecycleResponse(
        String status,
        Instant startedAt,
        int submissionCount,
        String lastSubmissionId
) {
}

package com.example.gittrainer.session.api;

import java.util.List;

record SessionCommitNodeResponse(
        String id,
        String summary,
        List<String> parentIds,
        List<SessionCommitRefResponse> refs
) {
}

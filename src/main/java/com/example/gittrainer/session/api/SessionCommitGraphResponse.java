package com.example.gittrainer.session.api;

import java.util.List;

record SessionCommitGraphResponse(
        List<SessionCommitNodeResponse> nodes
) {
}

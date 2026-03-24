package com.example.gittrainer.scenario.api;

import java.util.List;

record ScenarioCommitNodeResponse(
        String id,
        String summary,
        List<String> parentIds,
        List<ScenarioCommitRefResponse> refs
) {
}

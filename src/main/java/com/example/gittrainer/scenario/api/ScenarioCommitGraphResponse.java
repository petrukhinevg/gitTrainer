package com.example.gittrainer.scenario.api;

import java.util.List;

record ScenarioCommitGraphResponse(
        List<ScenarioCommitNodeResponse> nodes
) {
}

package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;

public record ScenarioDetailResult(
        ScenarioWorkspaceDetail detail,
        String source,
        boolean stub
) {
}

package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.ScenarioDetailQuery;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;

import java.util.Optional;

public interface ScenarioDetailGateway {

    Optional<ScenarioWorkspaceDetail> loadScenarioDetail(ScenarioDetailQuery query);

    String sourceName(ScenarioDetailQuery query);
}

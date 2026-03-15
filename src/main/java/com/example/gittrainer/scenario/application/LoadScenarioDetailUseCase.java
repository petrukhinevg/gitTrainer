package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.ScenarioDetailQuery;
import org.springframework.stereotype.Service;

@Service
public class LoadScenarioDetailUseCase {

    private final ScenarioDetailGateway scenarioDetailGateway;

    public LoadScenarioDetailUseCase(ScenarioDetailGateway scenarioDetailGateway) {
        this.scenarioDetailGateway = scenarioDetailGateway;
    }

    public ScenarioDetailResult load(ScenarioDetailQuery query) {
        return new ScenarioDetailResult(
                scenarioDetailGateway.loadScenarioDetail(query)
                        .orElseThrow(() -> new ScenarioDetailNotFoundException(query.slug())),
                scenarioDetailGateway.sourceName(query),
                true
        );
    }
}

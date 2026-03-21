package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.ScenarioDetailQuery;
import com.example.gittrainer.session.application.SessionScenarioReadPort;
import com.example.gittrainer.session.application.SessionScenarioSnapshot;
import org.springframework.stereotype.Component;

@Component
public class ScenarioSessionReadBridge implements SessionScenarioReadPort {

    private final ScenarioDetailGateway scenarioDetailGateway;

    public ScenarioSessionReadBridge(ScenarioDetailGateway scenarioDetailGateway) {
        this.scenarioDetailGateway = scenarioDetailGateway;
    }

    @Override
    public SessionScenarioSnapshot loadForSessionStart(String scenarioSlug, String source) {
        ScenarioDetailQuery query = new ScenarioDetailQuery(scenarioSlug, source);
        return scenarioDetailGateway.loadScenarioDetail(query)
                .map(detail -> new SessionScenarioSnapshot(
                        detail.slug(),
                        detail.title(),
                        scenarioDetailGateway.sourceName(query)
                ))
                .orElseThrow(() -> new ScenarioDetailNotFoundException(scenarioSlug));
    }
}

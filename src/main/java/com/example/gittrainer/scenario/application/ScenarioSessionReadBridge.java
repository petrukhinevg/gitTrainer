package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.session.application.SessionScenarioReadPort;
import com.example.gittrainer.session.application.SessionScenarioSnapshot;
import org.springframework.stereotype.Component;

@Component
public class ScenarioSessionReadBridge implements SessionScenarioReadPort {

    private final ScenarioCatalogGateway scenarioCatalogGateway;

    public ScenarioSessionReadBridge(ScenarioCatalogGateway scenarioCatalogGateway) {
        this.scenarioCatalogGateway = scenarioCatalogGateway;
    }

    @Override
    public SessionScenarioSnapshot loadForSessionStart(String scenarioSlug, String source) {
        CatalogBrowseQuery query = new CatalogBrowseQuery(null, null, null, source);
        return scenarioCatalogGateway.loadCatalog(query).stream()
                .filter(item -> item.slug().equals(scenarioSlug))
                .findFirst()
                .map(scenario -> new SessionScenarioSnapshot(
                        scenario.slug(),
                        scenario.title(),
                        scenarioCatalogGateway.sourceName(query)
                ))
                .orElseThrow(() -> new ScenarioDetailNotFoundException(scenarioSlug));
    }
}

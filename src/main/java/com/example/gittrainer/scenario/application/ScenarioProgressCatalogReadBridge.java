package com.example.gittrainer.scenario.application;

import com.example.gittrainer.progress.application.ProgressScenarioCatalogReadPort;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import org.springframework.stereotype.Component;

@Component
public class ScenarioProgressCatalogReadBridge implements ProgressScenarioCatalogReadPort {

    private final ScenarioCatalogGateway scenarioCatalogGateway;
    private final CatalogQueryPolicy catalogQueryPolicy;

    public ScenarioProgressCatalogReadBridge(
            ScenarioCatalogGateway scenarioCatalogGateway,
            CatalogQueryPolicy catalogQueryPolicy
    ) {
        this.scenarioCatalogGateway = scenarioCatalogGateway;
        this.catalogQueryPolicy = catalogQueryPolicy;
    }

    @Override
    public ProgressScenarioCatalogSnapshot loadCatalog() {
        CatalogBrowseQuery query = new CatalogBrowseQuery(null, null, null, null);
        return new ProgressScenarioCatalogSnapshot(
                catalogQueryPolicy.apply(scenarioCatalogGateway.loadCatalog(query), query).stream()
                        .map(item -> new ProgressScenarioSnapshot(item.slug(), item.title()))
                        .toList(),
                scenarioCatalogGateway.sourceName(query)
        );
    }
}

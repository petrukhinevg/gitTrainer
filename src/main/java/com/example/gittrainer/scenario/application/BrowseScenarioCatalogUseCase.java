package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import org.springframework.stereotype.Service;

@Service
public class BrowseScenarioCatalogUseCase {

    private final ScenarioCatalogGateway scenarioCatalogGateway;

    public BrowseScenarioCatalogUseCase(ScenarioCatalogGateway scenarioCatalogGateway) {
        this.scenarioCatalogGateway = scenarioCatalogGateway;
    }

    public CatalogBrowseResult browse(CatalogBrowseQuery query) {
        return new CatalogBrowseResult(
                scenarioCatalogGateway.loadCatalog(query),
                query,
                scenarioCatalogGateway.sourceName()
        );
    }
}

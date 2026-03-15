package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import org.springframework.stereotype.Service;

@Service
public class BrowseScenarioCatalogUseCase {

    private final ScenarioCatalogGateway scenarioCatalogGateway;
    private final CatalogQueryPolicy catalogQueryPolicy;

    public BrowseScenarioCatalogUseCase(
            ScenarioCatalogGateway scenarioCatalogGateway,
            CatalogQueryPolicy catalogQueryPolicy
    ) {
        this.scenarioCatalogGateway = scenarioCatalogGateway;
        this.catalogQueryPolicy = catalogQueryPolicy;
    }

    public CatalogBrowseResult browse(CatalogBrowseQuery query) {
        return new CatalogBrowseResult(
                catalogQueryPolicy.apply(scenarioCatalogGateway.loadCatalog(query), query),
                query,
                scenarioCatalogGateway.sourceName(query)
        );
    }
}

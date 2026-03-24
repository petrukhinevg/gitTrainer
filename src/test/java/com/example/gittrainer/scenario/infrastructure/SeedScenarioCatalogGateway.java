package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioCatalogGateway;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Profile("test")
public class SeedScenarioCatalogGateway implements ScenarioCatalogGateway {

    private final SeedScenarioCatalogSource scenarioCatalogSeedSource;

    public SeedScenarioCatalogGateway(SeedScenarioCatalogSource scenarioCatalogSeedSource) {
        this.scenarioCatalogSeedSource = scenarioCatalogSeedSource;
    }

    @Override
    public List<ScenarioSummary> loadCatalog(CatalogBrowseQuery query) {
        return resolveSeed(query).items();
    }

    @Override
    public String sourceName(CatalogBrowseQuery query) {
        return resolveSeed(query).sourceName();
    }

    private SeedScenarioCatalog resolveSeed(CatalogBrowseQuery query) {
        String source = query.source();
        if (source == null || source.isBlank() || source.equalsIgnoreCase("default")) {
            return scenarioCatalogSeedSource.defaultCatalog();
        }
        if (source.equalsIgnoreCase("empty")) {
            return scenarioCatalogSeedSource.emptyCatalog();
        }
        if (source.equalsIgnoreCase("unavailable")) {
            return scenarioCatalogSeedSource.unavailableCatalog();
        }

        return scenarioCatalogSeedSource.defaultCatalog();
    }
}

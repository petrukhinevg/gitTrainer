package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioCatalogGateway;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class FixtureScenarioCatalogGateway implements ScenarioCatalogGateway {

    private final ScenarioCatalogFixtureSource scenarioCatalogFixtureSource;

    public FixtureScenarioCatalogGateway(ScenarioCatalogFixtureSource scenarioCatalogFixtureSource) {
        this.scenarioCatalogFixtureSource = scenarioCatalogFixtureSource;
    }

    @Override
    public List<ScenarioSummary> loadCatalog(CatalogBrowseQuery query) {
        return resolveFixture(query).items();
    }

    @Override
    public String sourceName(CatalogBrowseQuery query) {
        return resolveFixture(query).sourceName();
    }

    private ScenarioCatalogFixture resolveFixture(CatalogBrowseQuery query) {
        String source = query.source();
        if (source == null || source.isBlank() || source.equalsIgnoreCase("default")) {
            return scenarioCatalogFixtureSource.defaultCatalog();
        }
        if (source.equalsIgnoreCase("empty")) {
            return scenarioCatalogFixtureSource.emptyCatalog();
        }
        if (source.equalsIgnoreCase("unavailable")) {
            return scenarioCatalogFixtureSource.unavailableCatalog();
        }

        return scenarioCatalogFixtureSource.defaultCatalog();
    }
}

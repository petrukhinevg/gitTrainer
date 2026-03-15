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
        return scenarioCatalogFixtureSource.defaultCatalog().items();
    }

    @Override
    public String sourceName() {
        return scenarioCatalogFixtureSource.defaultCatalog().sourceName();
    }
}

package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioSourceUnavailableException;
import org.springframework.stereotype.Component;

@Component
public class ScenarioCatalogFixtureSource {

    private static final ScenarioCatalogFixture EMPTY_CATALOG = new ScenarioCatalogFixture(
            "mvp-fixture-empty",
            java.util.List.of()
    );

    private final AuthoredScenarioResourceLoader resourceLoader;

    public ScenarioCatalogFixtureSource(AuthoredScenarioResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    public ScenarioCatalogFixture defaultCatalog() {
        return resourceLoader.defaultCatalog();
    }

    public ScenarioCatalogFixture emptyCatalog() {
        return EMPTY_CATALOG;
    }

    public ScenarioCatalogFixture unavailableCatalog() {
        throw new ScenarioSourceUnavailableException(
                "mvp-fixture-unavailable",
                "Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."
        );
    }
}

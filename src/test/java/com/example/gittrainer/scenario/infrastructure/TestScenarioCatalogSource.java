package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioSourceUnavailableException;
import org.springframework.stereotype.Component;

@Component
public class TestScenarioCatalogSource {

    private static final TestScenarioCatalog EMPTY_CATALOG = new TestScenarioCatalog(
            "db-seeded-empty",
            java.util.List.of()
    );

    private final AuthoredScenarioResourceLoader resourceLoader;

    public TestScenarioCatalogSource(AuthoredScenarioResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    public TestScenarioCatalog defaultCatalog() {
        return resourceLoader.defaultCatalog();
    }

    public TestScenarioCatalog emptyCatalog() {
        return EMPTY_CATALOG;
    }

    public TestScenarioCatalog unavailableCatalog() {
        throw new ScenarioSourceUnavailableException(
                "db-seeded-unavailable",
                "Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."
        );
    }
}

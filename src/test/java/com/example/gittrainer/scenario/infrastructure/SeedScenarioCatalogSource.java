package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioSourceUnavailableException;
import org.springframework.stereotype.Component;

@Component
public class SeedScenarioCatalogSource {

    private static final SeedScenarioCatalog EMPTY_CATALOG = new SeedScenarioCatalog(
            "db-seeded-empty",
            java.util.List.of()
    );

    private final SeedScenarioResourceLoader resourceLoader;

    public SeedScenarioCatalogSource(SeedScenarioResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    public SeedScenarioCatalog defaultCatalog() {
        return resourceLoader.defaultCatalog();
    }

    public SeedScenarioCatalog emptyCatalog() {
        return EMPTY_CATALOG;
    }

    public SeedScenarioCatalog unavailableCatalog() {
        throw new ScenarioSourceUnavailableException(
                "db-seeded-unavailable",
                "Источник каталога сейчас недоступен. Выберите другой источник или повторите позже."
        );
    }
}

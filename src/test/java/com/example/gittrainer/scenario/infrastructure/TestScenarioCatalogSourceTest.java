package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioSourceUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class TestScenarioCatalogSourceTest {

    @Autowired
    private TestScenarioCatalogSource scenarioCatalogFixtureSource;

    @Test
    void providesAuthoredFixtureCatalogForMvpBrowsing() {
        TestScenarioCatalog fixture = scenarioCatalogFixtureSource.defaultCatalog();

        assertThat(fixture.sourceName()).isEqualTo("db-seeded");
        assertThat(fixture.items())
                .extracting(item -> item.id())
                .containsExactly(
                        "status-basics",
                        "branch-safety",
                        "history-cleanup-preview",
                        "remote-sync-preview",
                        "stash-checkpoint-draft",
                        "merge-sandbox-outline",
                        "tag-checkpoint-preview"
                );
    }

    @Test
    void providesEmptyFixtureUsingSameCatalogSchema() {
        TestScenarioCatalog fixture = scenarioCatalogFixtureSource.emptyCatalog();

        assertThat(fixture.sourceName()).isEqualTo("db-seeded-empty");
        assertThat(fixture.items()).isEmpty();
    }

    @Test
    void providesUnavailableSourceFixtureAsDomainSpecificFailure() {
        assertThatThrownBy(() -> scenarioCatalogFixtureSource.unavailableCatalog())
                .isInstanceOf(ScenarioSourceUnavailableException.class)
                .hasMessage("Источник каталога сейчас недоступен. Выберите другой источник или повторите позже.");
    }
}

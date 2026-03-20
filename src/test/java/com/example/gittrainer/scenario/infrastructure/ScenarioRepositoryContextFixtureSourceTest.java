package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioRepositoryContextNotAuthoredException;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class ScenarioRepositoryContextFixtureSourceTest {

    @Autowired
    private ScenarioRepositoryContextFixtureSource scenarioRepositoryContextFixtureSource;

    @Test
    void providesAuthoredRepositoryContextFixtureForKnownScenario() {
        ScenarioWorkspaceDetail.ScenarioRepositoryContext fixture =
                scenarioRepositoryContextFixtureSource.fixtureFor("status-basics");

        assertThat(fixture.status()).isEqualTo("authored-fixture");
        assertThat(fixture.branches()).hasSize(2);
        assertThat(fixture.commits()).hasSize(2);
        assertThat(fixture.files()).hasSize(3);
        assertThat(fixture.annotations()).hasSize(2);
    }

    @Test
    void providesHistoryCleanupRepositoryContextWithPreviewCues() {
        ScenarioWorkspaceDetail.ScenarioRepositoryContext fixture =
                scenarioRepositoryContextFixtureSource.fixtureFor("history-cleanup-preview");

        assertThat(fixture.branches())
                .extracting(ScenarioWorkspaceDetail.ScenarioRepositoryBranch::name)
                .containsExactly("feature/history-cleanup", "main");
        assertThat(fixture.commits())
                .extracting(ScenarioWorkspaceDetail.ScenarioRepositoryCommit::summary)
                .containsExactly(
                        "fixup! ui: переименовать бейдж оболочки",
                        "ui: переименовать бейдж оболочки",
                        "wip: ещё раз подправить отступы"
                );
        assertThat(fixture.annotations())
                .extracting(ScenarioWorkspaceDetail.ScenarioWorkspaceAnnotation::label)
                .containsExactly("Сигнал для preview истории", "Почему rebase ещё рано");
    }

    @Test
    void failsExplicitlyWhenRepositoryContextWasNotAuthoredForScenario() {
        assertThatThrownBy(() -> scenarioRepositoryContextFixtureSource.fixtureFor("not-authored-yet"))
                .isInstanceOf(ScenarioRepositoryContextNotAuthoredException.class)
                .hasMessage("Контекст репозитория не подготовлен для сценария: not-authored-yet");
    }
}

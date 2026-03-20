package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContentNotAuthoredException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class ScenarioTaskContentFixtureSourceTest {

    @Autowired
    private ScenarioTaskContentFixtureSource scenarioTaskContentFixtureSource;

    @Test
    void providesAuthoredTaskContentFixtureForKnownScenario() {
        ScenarioTaskContentFixture fixture = scenarioTaskContentFixtureSource.fixtureFor("status-basics");

        assertThat(fixture.status()).isEqualTo("authored-fixture");
        assertThat(fixture.instructions()).hasSize(3);
        assertThat(fixture.steps()).hasSize(3);
        assertThat(fixture.annotations()).hasSize(2);
    }

    @Test
    void providesHistoryCleanupTaskContentThatLeadsWithHistoryPreview() {
        ScenarioTaskContentFixture fixture = scenarioTaskContentFixtureSource.fixtureFor("history-cleanup-preview");

        assertThat(fixture.goal()).contains("граф коммитов");
        assertThat(fixture.instructions())
                .extracting(ScenarioTaskContentFixture.ScenarioTaskInstructionFixture::id)
                .containsExactly(
                        "preview-commit-graph-before-rewrite",
                        "use-fixup-and-wip-as-cues",
                        "keep-next-step-in-preview-mode"
                );
        assertThat(fixture.steps().getFirst().title()).isEqualTo("Просмотрите верхушку истории");
        assertThat(fixture.annotations())
                .extracting(ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture::label)
                .containsExactly("Что считается безопасным шагом", "Граница сценария");
    }

    @Test
    void providesRemoteSyncTaskContentThatLeadsWithFetch() {
        ScenarioTaskContentFixture fixture = scenarioTaskContentFixtureSource.fixtureFor("remote-sync-preview");

        assertThat(fixture.goal()).contains("remote-tracking");
        assertThat(fixture.instructions())
                .extracting(ScenarioTaskContentFixture.ScenarioTaskInstructionFixture::id)
                .containsExactly(
                        "refresh-remote-state-before-integration",
                        "treat-local-ahead-and-remote-behind-as-incomplete-view",
                        "keep-next-step-in-preview-mode"
                );
        assertThat(fixture.steps().getFirst().title()).isEqualTo("Обновите удалённые refs");
        assertThat(fixture.annotations())
                .extracting(ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture::label)
                .containsExactly("Что считается безопасным шагом", "Граница сценария");
    }

    @Test
    void providesBranchSafetyTaskContentThatLeadsWithBranchInspection() {
        ScenarioTaskContentFixture fixture = scenarioTaskContentFixtureSource.fixtureFor("branch-safety");

        assertThat(fixture.goal()).contains("подтвердите активную ветку");
        assertThat(fixture.instructions())
                .extracting(ScenarioTaskContentFixture.ScenarioTaskInstructionFixture::id)
                .containsExactly(
                        "confirm-active-branch-before-switching",
                        "connect-open-edits-to-branch-purpose",
                        "keep-next-step-observable"
                );
        assertThat(fixture.steps().getFirst().title()).isEqualTo("Подтвердите текущую ветку");
        assertThat(fixture.annotations())
                .extracting(ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture::label)
                .containsExactly("Что считается безопасным шагом", "Граница решения");
    }

    @Test
    void failsExplicitlyWhenTaskContentWasNotAuthoredForScenario() {
        assertThatThrownBy(() -> scenarioTaskContentFixtureSource.fixtureFor("not-authored-yet"))
                .isInstanceOf(ScenarioTaskContentNotAuthoredException.class)
                .hasMessage("Описание задания не подготовлено для сценария: not-authored-yet");
    }
}

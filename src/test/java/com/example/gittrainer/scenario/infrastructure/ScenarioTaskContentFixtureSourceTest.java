package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContent;
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
        ScenarioTaskContent fixture = scenarioTaskContentFixtureSource.loadTaskContent("status-basics");

        assertThat(fixture.status()).isEqualTo("authored-fixture");
        assertThat(fixture.instructions()).hasSize(3);
        assertThat(fixture.steps()).hasSize(5);
        assertThat(fixture.annotations()).hasSize(2);
    }

    @Test
    void providesHistoryCleanupTaskContentThatLeadsWithHistoryPreview() {
        ScenarioTaskContent fixture = scenarioTaskContentFixtureSource.loadTaskContent("history-cleanup-preview");

        assertThat(fixture.goal()).contains("верхушку истории");
        assertThat(fixture.instructions())
                .extracting(ScenarioTaskContent.ScenarioTaskInstruction::id)
                .containsExactly(
                        "preview-commit-graph-before-rewrite",
                        "use-fixup-and-wip-as-cues",
                        "keep-next-step-in-preview-mode"
                );
        assertThat(fixture.steps().getFirst().title()).isEqualTo("Посмотрите на верхушку ветки");
        assertThat(fixture.annotations())
                .extracting(ScenarioTaskContent.ScenarioTaskAnnotation::label)
                .containsExactly("Что нужно увидеть", "Какой шаг ожидается");
    }

    @Test
    void providesRemoteSyncTaskContentThatLeadsWithFetch() {
        ScenarioTaskContent fixture = scenarioTaskContentFixtureSource.loadTaskContent("remote-sync-preview");

        assertThat(fixture.goal()).contains("remote-tracking");
        assertThat(fixture.instructions())
                .extracting(ScenarioTaskContent.ScenarioTaskInstruction::id)
                .containsExactly(
                        "refresh-remote-state-before-integration",
                        "treat-local-ahead-and-remote-behind-as-incomplete-view",
                        "keep-next-step-in-preview-mode"
                );
        assertThat(fixture.steps().getFirst().title()).isEqualTo("Заметьте, что данные об `origin/main` могут устареть");
        assertThat(fixture.annotations())
                .extracting(ScenarioTaskContent.ScenarioTaskAnnotation::label)
                .containsExactly("Что проверяем", "Какой шаг ожидается");
    }

    @Test
    void providesBranchSafetyTaskContentThatLeadsWithBranchInspection() {
        ScenarioTaskContent fixture = scenarioTaskContentFixtureSource.loadTaskContent("branch-safety");

        assertThat(fixture.goal()).contains("`release/hotfix-7`");
        assertThat(fixture.instructions())
                .extracting(ScenarioTaskContent.ScenarioTaskInstruction::id)
                .containsExactly(
                        "confirm-active-branch-before-switching",
                        "connect-open-edits-to-branch-purpose",
                        "keep-next-step-observable"
                );
        assertThat(fixture.steps().getFirst().title()).isEqualTo("Подтвердите активную ветку");
        assertThat(fixture.annotations())
                .extracting(ScenarioTaskContent.ScenarioTaskAnnotation::label)
                .containsExactly("Что проверяем", "Какой шаг ожидается");
    }

    @Test
    void failsExplicitlyWhenTaskContentWasNotAuthoredForScenario() {
        assertThatThrownBy(() -> scenarioTaskContentFixtureSource.loadTaskContent("not-authored-yet"))
                .isInstanceOf(ScenarioTaskContentNotAuthoredException.class)
                .hasMessage("Описание задания не подготовлено для сценария: not-authored-yet");
    }
}

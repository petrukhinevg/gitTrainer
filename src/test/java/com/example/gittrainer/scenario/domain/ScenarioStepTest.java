package com.example.gittrainer.scenario.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class ScenarioStepTest {

    @Test
    void createsScenarioStepWithInstructionOutcomeAndExplanation() {
        ScenarioStep step = new ScenarioStep(
                1,
                " Switch to the feature branch. ",
                new ExpectedOutcome(
                        OutcomeType.COMMAND,
                        "active-branch",
                        List.of("git switch feature/login", "git checkout feature/login")
                ),
                " Use a branch switch command that targets the existing branch. "
        );

        assertThat(step.order()).isEqualTo(1);
        assertThat(step.instruction()).isEqualTo("Switch to the feature branch.");
        assertThat(step.explanation()).isEqualTo("Use a branch switch command that targets the existing branch.");
    }

    @Test
    void rejectsStepWithoutExplanation() {
        assertThatThrownBy(() -> new ScenarioStep(
                1,
                "Check the current repository state.",
                new ExpectedOutcome(
                        OutcomeType.COMMAND,
                        "working-tree-state",
                        List.of("git status")
                ),
                " "
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("explanation must not be blank");
    }
}

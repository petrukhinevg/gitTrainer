package com.example.gittrainer.scenario.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class ExpectedOutcomeTest {

    @Test
    void createsExpectedOutcomeWithNormalizedTarget() {
        ExpectedOutcome outcome = new ExpectedOutcome(
                OutcomeType.COMMAND,
                " active-branch ",
                List.of("git switch feature/login", "git checkout feature/login")
        );

        assertThat(outcome.type()).isEqualTo(OutcomeType.COMMAND);
        assertThat(outcome.target()).isEqualTo("active-branch");
        assertThat(outcome.acceptableRepresentations())
                .containsExactly("git switch feature/login", "git checkout feature/login");
    }

    @Test
    void rejectsExpectedOutcomeWithoutMachineReadableTarget() {
        assertThatThrownBy(() -> new ExpectedOutcome(
                OutcomeType.COMMAND,
                " ",
                List.of("git status")
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("target must not be blank");
    }

    @Test
    void rejectsExpectedOutcomeWithoutAcceptedRepresentations() {
        assertThatThrownBy(() -> new ExpectedOutcome(
                OutcomeType.REPOSITORY_STATE,
                "active-branch",
                List.of()
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("acceptableRepresentations must not be empty");
    }
}

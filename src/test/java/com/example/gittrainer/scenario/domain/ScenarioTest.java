package com.example.gittrainer.scenario.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class ScenarioTest {

    @Test
    void createsScenarioWithSequentialSteps() {
        Scenario scenario = new Scenario(
                new ScenarioId("branch-switch-basics"),
                new ScenarioMetadata(
                        "Switch to an existing branch",
                        new ScenarioTopic("branching"),
                        ScenarioDifficulty.BEGINNER,
                        "Practice moving between local branches."
                ),
                List.of(
                        new ScenarioStep(
                                1,
                                "Move to the feature branch.",
                                new ExpectedOutcome(
                                        OutcomeType.COMMAND,
                                        "The learner switches to feature/login.",
                                        List.of("git switch feature/login", "git checkout feature/login")
                                ),
                                "Use a branch switch command that targets the existing branch."
                        )
                )
        );

        assertThat(scenario.id().value()).isEqualTo("branch-switch-basics");
        assertThat(scenario.steps()).hasSize(1);
        assertThat(scenario.steps().getFirst().expectedOutcome().acceptedAnswers())
                .containsExactly("git switch feature/login", "git checkout feature/login");
    }

    @Test
    void rejectsScenarioWithoutSteps() {
        assertThatThrownBy(() -> new Scenario(
                new ScenarioId("status-check"),
                new ScenarioMetadata(
                        "Inspect repository status",
                        new ScenarioTopic("status"),
                        ScenarioDifficulty.BEGINNER,
                        "Practice checking the current working tree."
                ),
                List.of()
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("steps must not be empty");
    }

    @Test
    void rejectsNonSequentialStepOrder() {
        assertThatThrownBy(() -> new Scenario(
                new ScenarioId("bad-order"),
                new ScenarioMetadata(
                        "Broken step ordering",
                        new ScenarioTopic("branching"),
                        ScenarioDifficulty.BEGINNER,
                        "This scenario should not be accepted."
                ),
                List.of(
                        new ScenarioStep(
                                2,
                                "Move to the bugfix branch.",
                                new ExpectedOutcome(
                                        OutcomeType.COMMAND,
                                        "The learner switches branches.",
                                        List.of("git switch bugfix/login")
                                ),
                                "The branch already exists."
                        )
                )
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("steps must be ordered sequentially starting from 1");
    }

    @Test
    void rejectsExpectedOutcomeWithoutAcceptedAnswers() {
        assertThatThrownBy(() -> new ExpectedOutcome(
                OutcomeType.COMMAND,
                "The learner runs the correct command.",
                List.of()
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("acceptedAnswers must not be empty");
    }

    @Test
    void rejectsMetadataWithoutTitle() {
        assertThatThrownBy(() -> new ScenarioMetadata(
                " ",
                new ScenarioTopic("branching"),
                ScenarioDifficulty.BEGINNER,
                "Practice changing branches."
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("title must not be blank");
    }

    @Test
    void rejectsStepWithoutInstruction() {
        assertThatThrownBy(() -> new ScenarioStep(
                1,
                " ",
                new ExpectedOutcome(
                        OutcomeType.COMMAND,
                        "The learner checks repository status.",
                        List.of("git status")
                ),
                "Inspect the working tree before making changes."
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("instruction must not be blank");
    }

    @Test
    void rejectsStepWithoutExplanation() {
        assertThatThrownBy(() -> new ScenarioStep(
                1,
                "Check the current repository state.",
                new ExpectedOutcome(
                        OutcomeType.COMMAND,
                        "The learner checks repository status.",
                        List.of("git status")
                ),
                " "
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("explanation must not be blank");
    }
}

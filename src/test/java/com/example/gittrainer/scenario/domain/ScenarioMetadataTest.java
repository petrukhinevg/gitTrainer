package com.example.gittrainer.scenario.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class ScenarioMetadataTest {

    @Test
    void createsScenarioMetadataWithTrimmedText() {
        ScenarioMetadata metadata = new ScenarioMetadata(
                new ScenarioId(" branch-switch-basics "),
                " Switch to an existing branch ",
                new ScenarioTopic(" branching "),
                ScenarioDifficulty.BEGINNER,
                " Practice moving between local branches. "
        );

        assertThat(metadata.id().value()).isEqualTo("branch-switch-basics");
        assertThat(metadata.title()).isEqualTo("Switch to an existing branch");
        assertThat(metadata.topic().value()).isEqualTo("branching");
        assertThat(metadata.summary()).isEqualTo("Practice moving between local branches.");
    }

    @Test
    void rejectsBlankScenarioId() {
        assertThatThrownBy(() -> new ScenarioId("  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("scenario id must not be blank");
    }

    @Test
    void rejectsMetadataWithoutTitle() {
        assertThatThrownBy(() -> new ScenarioMetadata(
                new ScenarioId("status-check"),
                " ",
                new ScenarioTopic("status"),
                ScenarioDifficulty.BEGINNER,
                "Practice checking the current working tree."
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("title must not be blank");
    }
}

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
    void failsExplicitlyWhenTaskContentWasNotAuthoredForScenario() {
        assertThatThrownBy(() -> scenarioTaskContentFixtureSource.fixtureFor("not-authored-yet"))
                .isInstanceOf(ScenarioTaskContentNotAuthoredException.class)
                .hasMessage("Контент задания недоступен для slug: not-authored-yet");
    }
}

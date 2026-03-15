package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import com.example.gittrainer.scenario.infrastructure.ScenarioTaskContentFixture;
import com.example.gittrainer.scenario.infrastructure.ScenarioTaskContentFixtureSource;
import org.springframework.stereotype.Component;

@Component
public class ScenarioTaskContentAssembler {

    private final ScenarioTaskContentFixtureSource scenarioTaskContentFixtureSource;

    public ScenarioTaskContentAssembler(ScenarioTaskContentFixtureSource scenarioTaskContentFixtureSource) {
        this.scenarioTaskContentFixtureSource = scenarioTaskContentFixtureSource;
    }

    public ScenarioWorkspaceDetail.ScenarioTaskPreview assemble(String scenarioSlug) {
        ScenarioTaskContentFixture fixture = scenarioTaskContentFixtureSource.fixtureFor(scenarioSlug);
        return new ScenarioWorkspaceDetail.ScenarioTaskPreview(
                fixture.status(),
                fixture.goal(),
                fixture.instructions().stream()
                        .sorted((left, right) -> Integer.compare(left.position(), right.position()))
                        .map(instruction -> new ScenarioWorkspaceDetail.ScenarioTaskInstruction(
                                instruction.id(),
                                instruction.text()
                        ))
                        .toList(),
                fixture.steps().stream()
                        .sorted((left, right) -> Integer.compare(left.position(), right.position()))
                        .map(step -> new ScenarioWorkspaceDetail.ScenarioTaskStep(
                                step.position(),
                                step.title(),
                                step.detail()
                        ))
                        .toList(),
                fixture.annotations().stream()
                        .sorted((left, right) -> Integer.compare(left.position(), right.position()))
                        .map(annotation -> new ScenarioWorkspaceDetail.ScenarioTaskAnnotation(
                                annotation.label(),
                                annotation.message()
                        ))
                        .toList()
        );
    }
}

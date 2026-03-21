package com.example.gittrainer.scenario.application;

import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.springframework.stereotype.Component;

@Component
public class ScenarioTaskContentAssembler {

    private final ScenarioTaskContentGateway scenarioTaskContentGateway;

    public ScenarioTaskContentAssembler(ScenarioTaskContentGateway scenarioTaskContentGateway) {
        this.scenarioTaskContentGateway = scenarioTaskContentGateway;
    }

    public ScenarioWorkspaceDetail.ScenarioTaskPreview assemble(String scenarioSlug) {
        ScenarioTaskContent taskContent = scenarioTaskContentGateway.loadTaskContent(scenarioSlug);
        return new ScenarioWorkspaceDetail.ScenarioTaskPreview(
                taskContent.status(),
                taskContent.goal(),
                taskContent.instructions().stream()
                        .sorted((left, right) -> Integer.compare(left.position(), right.position()))
                        .map(instruction -> new ScenarioWorkspaceDetail.ScenarioTaskInstruction(
                                instruction.id(),
                                instruction.text()
                        ))
                        .toList(),
                taskContent.steps().stream()
                        .sorted((left, right) -> Integer.compare(left.position(), right.position()))
                        .map(step -> new ScenarioWorkspaceDetail.ScenarioTaskStep(
                                step.position(),
                                step.title(),
                                step.detail()
                        ))
                        .toList(),
                taskContent.annotations().stream()
                        .sorted((left, right) -> Integer.compare(left.position(), right.position()))
                        .map(annotation -> new ScenarioWorkspaceDetail.ScenarioTaskAnnotation(
                                annotation.label(),
                                annotation.message()
                        ))
                        .toList()
        );
    }
}

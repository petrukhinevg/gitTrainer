package com.example.gittrainer.scenario.application;

import java.util.List;

public record ScenarioTaskContent(
        String status,
        String goal,
        List<ScenarioTaskInstruction> instructions,
        List<ScenarioTaskStep> steps,
        List<ScenarioTaskAnnotation> annotations
) {

    public ScenarioTaskContent {
        instructions = instructions == null ? List.of() : List.copyOf(instructions);
        steps = steps == null ? List.of() : List.copyOf(steps);
        annotations = annotations == null ? List.of() : List.copyOf(annotations);
    }

    public record ScenarioTaskInstruction(
            int position,
            String id,
            String text
    ) {
    }

    public record ScenarioTaskStep(
            int position,
            String title,
            String detail
    ) {
    }

    public record ScenarioTaskAnnotation(
            int position,
            String label,
            String message
    ) {
    }
}

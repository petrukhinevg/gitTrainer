package com.example.gittrainer.scenario.infrastructure;

import java.util.List;

public record ScenarioTaskContentFixture(
        String status,
        String goal,
        List<ScenarioTaskInstructionFixture> instructions,
        List<ScenarioTaskStepFixture> steps,
        List<ScenarioTaskAnnotationFixture> annotations
) {

    public ScenarioTaskContentFixture {
        instructions = instructions == null ? List.of() : List.copyOf(instructions);
        steps = steps == null ? List.of() : List.copyOf(steps);
        annotations = annotations == null ? List.of() : List.copyOf(annotations);
    }

    public record ScenarioTaskInstructionFixture(
            int position,
            String id,
            String text
    ) {
    }

    public record ScenarioTaskStepFixture(
            int position,
            String title,
            String detail
    ) {
    }

    public record ScenarioTaskAnnotationFixture(
            int position,
            String label,
            String message
    ) {
    }
}

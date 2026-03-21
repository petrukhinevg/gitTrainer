package com.example.gittrainer.scenario.api;

import java.util.List;

record ScenarioTaskPreviewResponse(
        String status,
        String goal,
        List<ScenarioTaskInstructionResponse> instructions,
        List<ScenarioTaskStepResponse> steps,
        List<ScenarioTaskAnnotationResponse> annotations
) {
}

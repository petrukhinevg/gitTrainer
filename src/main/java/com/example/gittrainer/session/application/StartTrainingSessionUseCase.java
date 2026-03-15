package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.StartTrainingSessionCommand;
import org.springframework.stereotype.Component;

@Component
public class StartTrainingSessionUseCase {

    private final TrainingSessionGateway trainingSessionGateway;

    public StartTrainingSessionUseCase(TrainingSessionGateway trainingSessionGateway) {
        this.trainingSessionGateway = trainingSessionGateway;
    }

    public StartedTrainingSession start(StartTrainingSessionCommand command) {
        String scenarioSlug = normalize(command.scenarioSlug(), "Scenario slug must not be blank.");
        return trainingSessionGateway.startSession(new StartTrainingSessionCommand(scenarioSlug));
    }

    private String normalize(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new InvalidSessionCommandException(message);
        }

        return value.trim();
    }
}

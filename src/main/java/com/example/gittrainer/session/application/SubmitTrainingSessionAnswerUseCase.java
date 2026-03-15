package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.SubmitTrainingSessionAnswerCommand;
import org.springframework.stereotype.Component;

@Component
public class SubmitTrainingSessionAnswerUseCase {

    private final TrainingSessionGateway trainingSessionGateway;

    public SubmitTrainingSessionAnswerUseCase(TrainingSessionGateway trainingSessionGateway) {
        this.trainingSessionGateway = trainingSessionGateway;
    }

    public SubmissionReceipt submit(SubmitTrainingSessionAnswerCommand command) {
        String sessionId = normalize(command.sessionId(), "Session id must not be blank.");
        String answer = normalize(command.answer(), "Answer must not be blank.");
        return trainingSessionGateway.submitAnswer(new SubmitTrainingSessionAnswerCommand(sessionId, answer));
    }

    private String normalize(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new InvalidSessionCommandException(message);
        }

        return value.trim();
    }
}

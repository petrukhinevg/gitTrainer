package com.example.gittrainer.session.application;

public class TrainingSessionNotFoundException extends RuntimeException {

    public TrainingSessionNotFoundException(String sessionId) {
        super("Training session '%s' was not found.".formatted(sessionId));
    }
}

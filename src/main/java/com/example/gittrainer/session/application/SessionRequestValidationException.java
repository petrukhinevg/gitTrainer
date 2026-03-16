package com.example.gittrainer.session.application;

public class SessionRequestValidationException extends RuntimeException {

    private final String errorCode;

    public SessionRequestValidationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String errorCode() {
        return errorCode;
    }

    public static SessionRequestValidationException missingScenarioSlug() {
        return new SessionRequestValidationException(
                "scenario-slug-required",
                "Scenario slug is required to start a session."
        );
    }

    public static SessionRequestValidationException missingSessionId() {
        return new SessionRequestValidationException(
                "session-id-required",
                "Session id is required to submit an answer."
        );
    }

    public static SessionRequestValidationException missingAnswer() {
        return new SessionRequestValidationException(
                "answer-required",
                "Answer text is required to submit a session attempt."
        );
    }
}

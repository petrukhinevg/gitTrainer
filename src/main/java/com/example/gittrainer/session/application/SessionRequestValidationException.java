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
                "Для запуска сессии нужен slug сценария."
        );
    }

    public static SessionRequestValidationException missingSessionId() {
        return new SessionRequestValidationException(
                "session-id-required",
                "Для отправки ответа нужен id сессии."
        );
    }

    public static SessionRequestValidationException missingAnswer() {
        return new SessionRequestValidationException(
                "answer-required",
                "Для отправки попытки нужен текст ответа."
        );
    }
}

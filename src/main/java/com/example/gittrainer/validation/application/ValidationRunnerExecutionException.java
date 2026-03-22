package com.example.gittrainer.validation.application;

public class ValidationRunnerExecutionException extends RuntimeException {

    private final String errorCode;

    public ValidationRunnerExecutionException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ValidationRunnerExecutionException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String errorCode() {
        return errorCode;
    }
}

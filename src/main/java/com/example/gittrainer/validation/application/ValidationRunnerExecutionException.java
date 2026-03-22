package com.example.gittrainer.validation.application;

public class ValidationRunnerExecutionException extends RuntimeException {

    private final String errorCode;
    private final String validatorSpecId;
    private final String validatorType;
    private final String runnerKind;
    private final long durationMs;

    public ValidationRunnerExecutionException(String errorCode, String message) {
        this(errorCode, message, null, null, null, null, 0L);
    }

    public ValidationRunnerExecutionException(String errorCode, String message, Throwable cause) {
        this(errorCode, message, cause, null, null, null, 0L);
    }

    public ValidationRunnerExecutionException(
            String errorCode,
            String message,
            Throwable cause,
            String validatorSpecId,
            String validatorType,
            String runnerKind,
            long durationMs
    ) {
        super(message, cause);
        this.errorCode = errorCode;
        this.validatorSpecId = validatorSpecId;
        this.validatorType = validatorType;
        this.runnerKind = runnerKind;
        this.durationMs = durationMs;
    }

    public String errorCode() {
        return errorCode;
    }

    public String validatorSpecId() {
        return validatorSpecId;
    }

    public String validatorType() {
        return validatorType;
    }

    public String runnerKind() {
        return runnerKind;
    }

    public long durationMs() {
        return durationMs;
    }
}

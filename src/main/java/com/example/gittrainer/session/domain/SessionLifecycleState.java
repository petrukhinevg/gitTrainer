package com.example.gittrainer.session.domain;

public enum SessionLifecycleState {
    ACTIVE("active"),
    SUBMISSION_RECEIVED("submission-received");

    private final String apiValue;

    SessionLifecycleState(String apiValue) {
        this.apiValue = apiValue;
    }

    public String apiValue() {
        return apiValue;
    }
}

package com.example.gittrainer.session.domain;

public record RetryHintSelection(
        String status,
        String level,
        String code
) {

    public static RetryHintSelection notNeeded() {
        return new RetryHintSelection(
                "not-needed",
                "none",
                "no-retry-hint"
        );
    }

    public static RetryHintSelection selected(String level, String code) {
        return new RetryHintSelection("selected", level, code);
    }
}

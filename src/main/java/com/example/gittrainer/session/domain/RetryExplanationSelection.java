package com.example.gittrainer.session.domain;

public record RetryExplanationSelection(
        String status,
        String code,
        String focus
) {

    public static RetryExplanationSelection notNeeded() {
        return new RetryExplanationSelection(
                "not-needed",
                "no-retry-explanation",
                "none"
        );
    }

    public static RetryExplanationSelection selected(String code, String focus) {
        return new RetryExplanationSelection("selected", code, focus);
    }
}

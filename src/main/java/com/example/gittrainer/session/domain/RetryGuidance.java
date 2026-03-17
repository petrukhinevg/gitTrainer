package com.example.gittrainer.session.domain;

public record RetryGuidance(
        RetryExplanationSelection explanation,
        RetryHintSelection hint
) {

    public static RetryGuidance notNeeded() {
        return new RetryGuidance(
                RetryExplanationSelection.notNeeded(),
                RetryHintSelection.notNeeded()
        );
    }
}

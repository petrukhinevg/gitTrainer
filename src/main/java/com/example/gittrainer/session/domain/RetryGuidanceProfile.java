package com.example.gittrainer.session.domain;

public record RetryGuidanceProfile(
        String explanationCode,
        String focus,
        String hintTemplateCode
) {

    public static RetryGuidanceProfile fallback() {
        return new RetryGuidanceProfile(
                "retry-guidance-needs-scenario-review",
                "revisit-scenario-goal-before-next-attempt",
                "generic-retry"
        );
    }
}

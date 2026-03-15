package com.example.gittrainer.session.api;

public record SessionStartResponse(
        String sessionId,
        String scenarioSlug,
        String state,
        Transport transport
) {

    public record Transport(
            String submitAnswerUrl,
            String placeholderOutcomeCode
    ) {
    }
}

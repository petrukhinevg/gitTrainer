package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.SessionLifecycleState;

public record StartedTrainingSession(
        String sessionId,
        String scenarioSlug,
        SessionLifecycleState state
) {
}

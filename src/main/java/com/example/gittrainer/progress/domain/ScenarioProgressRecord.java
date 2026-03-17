package com.example.gittrainer.progress.domain;

import java.time.Instant;

public record ScenarioProgressRecord(
        String scenarioSlug,
        String scenarioTitle,
        String scenarioSource,
        Instant firstStartedAt,
        Instant lastStartedAt,
        Instant lastSubmittedAt,
        String lastSessionId,
        String lastSubmissionId,
        String lastCorrectness,
        int attemptCount,
        int completionCount,
        Instant lastCompletedAt
) {

    public static ScenarioProgressRecord started(ScenarioAttemptStart attemptStart) {
        return new ScenarioProgressRecord(
                attemptStart.scenarioSlug(),
                attemptStart.scenarioTitle(),
                attemptStart.scenarioSource(),
                attemptStart.startedAt(),
                attemptStart.startedAt(),
                null,
                attemptStart.sessionId(),
                null,
                null,
                0,
                0,
                null
        );
    }

    public ScenarioProgressRecord recordAttemptStart(ScenarioAttemptStart attemptStart) {
        return new ScenarioProgressRecord(
                attemptStart.scenarioSlug(),
                attemptStart.scenarioTitle(),
                attemptStart.scenarioSource(),
                firstStartedAt,
                attemptStart.startedAt(),
                lastSubmittedAt,
                attemptStart.sessionId(),
                lastSubmissionId,
                lastCorrectness,
                attemptCount,
                completionCount,
                lastCompletedAt
        );
    }

    public ScenarioProgressRecord recordAttemptOutcome(ScenarioAttemptOutcome attemptOutcome) {
        boolean completedAttempt = "correct".equals(attemptOutcome.correctness());
        return new ScenarioProgressRecord(
                attemptOutcome.scenarioSlug(),
                attemptOutcome.scenarioTitle(),
                attemptOutcome.scenarioSource(),
                firstStartedAt,
                lastStartedAt,
                attemptOutcome.submittedAt(),
                attemptOutcome.sessionId(),
                attemptOutcome.submissionId(),
                attemptOutcome.correctness(),
                attemptCount + 1,
                completedAttempt ? completionCount + 1 : completionCount,
                completedAttempt ? attemptOutcome.submittedAt() : lastCompletedAt
        );
    }
}

package com.example.gittrainer.session.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class RetryStatePolicyTest {

    @Test
    void keepsInitialStateIdleBeforeAnySubmission() {
        assertThat(RetryStatePolicy.initialState()).isEqualTo(RetryState.initial());
    }

    @Test
    void keepsStrongerHintLockedAfterFirstFailure() {
        TrainingSession failedSession = new TrainingSession(
                "session-1",
                "status-basics",
                "Status basics",
                "fixture",
                Instant.parse("2026-03-17T10:15:30Z"),
                SessionState.ACTIVE,
                1,
                1,
                "submission-1"
        );

        RetryState retryState = RetryStatePolicy.afterSubmission(failedSession, true);

        assertThat(retryState.phase()).isEqualTo(RetryStatePhase.RETRY_AVAILABLE);
        assertThat(retryState.attemptCount()).isEqualTo(1);
        assertThat(retryState.consecutiveFailureCount()).isEqualTo(1);
        assertThat(retryState.retryEligibility()).isEqualTo(RetryEligibility.ELIGIBLE);
        assertThat(retryState.strongerHintEligibility()).isEqualTo(StrongerHintEligibility.LOCKED);
    }

    @Test
    void unlocksStrongerHintAfterRepeatedFailures() {
        TrainingSession failedSession = new TrainingSession(
                "session-1",
                "status-basics",
                "Status basics",
                "fixture",
                Instant.parse("2026-03-17T10:15:30Z"),
                SessionState.ACTIVE,
                2,
                2,
                "submission-2"
        );

        RetryState retryState = RetryStatePolicy.afterSubmission(failedSession, true);

        assertThat(retryState.phase()).isEqualTo(RetryStatePhase.RETRY_AVAILABLE);
        assertThat(retryState.consecutiveFailureCount()).isEqualTo(2);
        assertThat(retryState.strongerHintEligibility()).isEqualTo(StrongerHintEligibility.ELIGIBLE);
    }

    @Test
    void clearsRetryNeedAfterCorrectSubmission() {
        TrainingSession completedSession = new TrainingSession(
                "session-1",
                "status-basics",
                "Status basics",
                "fixture",
                Instant.parse("2026-03-17T10:15:30Z"),
                SessionState.ACTIVE,
                3,
                0,
                "submission-3"
        );

        RetryState retryState = RetryStatePolicy.afterSubmission(completedSession, false);

        assertThat(retryState.phase()).isEqualTo(RetryStatePhase.COMPLETED);
        assertThat(retryState.attemptCount()).isEqualTo(3);
        assertThat(retryState.consecutiveFailureCount()).isZero();
        assertThat(retryState.retryEligibility()).isEqualTo(RetryEligibility.NOT_NEEDED);
        assertThat(retryState.strongerHintEligibility()).isEqualTo(StrongerHintEligibility.NOT_NEEDED);
    }
}

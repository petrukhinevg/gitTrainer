package com.example.gittrainer.session.domain;

public record RetryState(
        RetryStatePhase phase,
        int attemptCount,
        int consecutiveFailureCount,
        RetryEligibility retryEligibility,
        StrongerHintEligibility strongerHintEligibility
) {

    public static RetryState initial() {
        return new RetryState(
                RetryStatePhase.READY,
                0,
                0,
                RetryEligibility.NOT_NEEDED,
                StrongerHintEligibility.NOT_NEEDED
        );
    }

    public static RetryState completed(int attemptCount) {
        return new RetryState(
                RetryStatePhase.COMPLETED,
                attemptCount,
                0,
                RetryEligibility.NOT_NEEDED,
                StrongerHintEligibility.NOT_NEEDED
        );
    }

    public static RetryState retryAvailable(int attemptCount, int consecutiveFailureCount,
                                            StrongerHintEligibility strongerHintEligibility) {
        return new RetryState(
                RetryStatePhase.RETRY_AVAILABLE,
                attemptCount,
                consecutiveFailureCount,
                RetryEligibility.ELIGIBLE,
                strongerHintEligibility
        );
    }
}

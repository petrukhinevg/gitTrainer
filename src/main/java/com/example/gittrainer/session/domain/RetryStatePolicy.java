package com.example.gittrainer.session.domain;

public final class RetryStatePolicy {

    private static final int STRONGER_HINT_THRESHOLD = 2;

    private RetryStatePolicy() {
    }

    public static RetryState initialState() {
        return RetryState.initial();
    }

    public static RetryState afterSubmission(TrainingSession session, boolean requiresRetry) {
        if (session.submissionCount() == 0) {
            return initialState();
        }

        if (!requiresRetry) {
            return RetryState.completed(session.submissionCount());
        }

        StrongerHintEligibility strongerHintEligibility = session.consecutiveFailureCount() >= STRONGER_HINT_THRESHOLD
                ? StrongerHintEligibility.ELIGIBLE
                : StrongerHintEligibility.LOCKED;

        return RetryState.retryAvailable(
                session.submissionCount(),
                session.consecutiveFailureCount(),
                strongerHintEligibility
        );
    }
}

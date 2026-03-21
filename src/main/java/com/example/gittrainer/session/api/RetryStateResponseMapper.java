package com.example.gittrainer.session.api;

import com.example.gittrainer.session.domain.RetryState;
import org.springframework.stereotype.Component;

@Component
class RetryStateResponseMapper {

    RetryStateResponse toResponse(RetryState retryState) {
        RetryState safeRetryState = retryState == null ? RetryState.initial() : retryState;
        return new RetryStateResponse(
                toRetryStateStatus(safeRetryState),
                safeRetryState.attemptCount(),
                toRetryEligibility(safeRetryState)
        );
    }

    private String toRetryStateStatus(RetryState retryState) {
        return switch (retryState.phase()) {
            case READY -> "idle";
            case RETRY_AVAILABLE -> "retry-available";
            case COMPLETED -> "complete";
        };
    }

    private String toRetryEligibility(RetryState retryState) {
        return switch (retryState.retryEligibility()) {
            case NOT_NEEDED -> "not-needed";
            case ELIGIBLE -> "eligible";
        };
    }
}

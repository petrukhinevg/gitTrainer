package com.example.gittrainer.session.api;

import com.example.gittrainer.session.domain.RetryGuidance;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.stereotype.Component;

@Component
class SessionRetryFeedbackFactory {

    private final RetryStateResponseMapper retryStateResponseMapper;
    private final RetryExplanationResponseFactory retryExplanationResponseFactory;
    private final RetryHintResponseFactory retryHintResponseFactory;

    SessionRetryFeedbackFactory(
            RetryStateResponseMapper retryStateResponseMapper,
            RetryExplanationResponseFactory retryExplanationResponseFactory,
            RetryHintResponseFactory retryHintResponseFactory
    ) {
        this.retryStateResponseMapper = retryStateResponseMapper;
        this.retryExplanationResponseFactory = retryExplanationResponseFactory;
        this.retryHintResponseFactory = retryHintResponseFactory;
    }

    RetryFeedbackResponse toResponse(
            RetryState retryState,
            RetryGuidance retryGuidance,
            SubmissionOutcome outcome,
            String submittedAnswer
    ) {
        if (outcome == null
                || retryState == null
                || retryState.attemptCount() == 0
                || "placeholder".equals(outcome.status())) {
            return placeholderResponse(retryState);
        }

        if (!outcome.requiresRetry()) {
            return resolvedResponse(retryState);
        }

        return guidedResponse(retryState, retryGuidance, submittedAnswer);
    }

    private RetryFeedbackResponse placeholderResponse(RetryState retryState) {
        return new RetryFeedbackResponse(
                "placeholder",
                retryStateResponseMapper.toResponse(retryState),
                retryExplanationResponseFactory.placeholderResponse(),
                retryHintResponseFactory.placeholderResponse()
        );
    }

    private RetryFeedbackResponse resolvedResponse(RetryState retryState) {
        return new RetryFeedbackResponse(
                "resolved",
                retryStateResponseMapper.toResponse(retryState),
                retryExplanationResponseFactory.resolvedResponse(),
                retryHintResponseFactory.resolvedResponse()
        );
    }

    private RetryFeedbackResponse guidedResponse(
            RetryState retryState,
            RetryGuidance retryGuidance,
            String submittedAnswer
    ) {
        RetryGuidance safeGuidance = retryGuidance == null ? RetryGuidance.notNeeded() : retryGuidance;
        return new RetryFeedbackResponse(
                "guided",
                retryStateResponseMapper.toResponse(retryState),
                retryExplanationResponseFactory.guidedResponse(safeGuidance.explanation(), submittedAnswer),
                retryHintResponseFactory.guidedResponse(safeGuidance.hint())
        );
    }
}

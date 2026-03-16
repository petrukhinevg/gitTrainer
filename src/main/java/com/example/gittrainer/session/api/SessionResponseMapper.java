package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.StartSessionResult;
import com.example.gittrainer.session.application.SubmitAnswerResult;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class SessionResponseMapper {

    public SessionStartResponse toStartResponse(StartSessionResult result) {
        return new SessionStartResponse(
                result.session().sessionId(),
                new SessionScenarioResponse(
                        result.session().scenarioSlug(),
                        result.session().scenarioTitle(),
                        result.session().scenarioSource()
                ),
                toLifecycleResponse(result.session()),
                new SessionSubmissionBoundaryResponse(
                        result.supportedAnswerTypes(),
                        toOutcomeResponse(result.placeholderOutcome()),
                        toRetryFeedbackResponse(result.retryState())
                )
        );
    }

    public SessionSubmissionResponse toSubmissionResponse(SubmitAnswerResult result) {
        return new SessionSubmissionResponse(
                result.submissionId(),
                result.session().sessionId(),
                result.attemptNumber(),
                result.submittedAt(),
                toLifecycleResponse(result.session()),
                new SubmittedAnswerResponse(result.answer().type(), result.answer().value()),
                toOutcomeResponse(result.outcome()),
                toRetryFeedbackResponse(result.retryState())
        );
    }

    private SessionLifecycleResponse toLifecycleResponse(TrainingSession session) {
        return new SessionLifecycleResponse(
                session.state().name().toLowerCase(Locale.ROOT),
                session.startedAt(),
                session.submissionCount(),
                session.lastSubmissionId()
        );
    }

    private SubmissionOutcomeResponse toOutcomeResponse(SubmissionOutcome outcome) {
        return new SubmissionOutcomeResponse(
                outcome.status(),
                outcome.correctness(),
                outcome.code(),
                outcome.message()
        );
    }

    private RetryFeedbackResponse toRetryFeedbackResponse(RetryState retryState) {
        String explanationMessage = retryState.attemptCount() == 0
                ? "Retry guidance will mount here after the first evaluated submission."
                : "Retry explanation selection is reserved for the guided-retry epic tasks.";
        String hintMessage = retryState.attemptCount() == 0
                ? "Hint progression is idle until the learner receives evaluated feedback."
                : "Hint progression remains placeholder data until retry policy is connected.";

        return new RetryFeedbackResponse(
                "placeholder",
                new RetryStateResponse(
                        toRetryStateStatus(retryState),
                        retryState.attemptCount(),
                        toRetryEligibility(retryState)
                ),
                new RetryExplanationResponse(
                        "placeholder",
                        "Retry guidance",
                        explanationMessage
                ),
                new RetryHintResponse(
                        "placeholder",
                        "baseline",
                        hintMessage
                )
        );
    }

    private String toRetryStateStatus(RetryState retryState) {
        return switch (retryState.phase()) {
            case READY -> "idle";
            case RETRY_AVAILABLE -> "awaiting-policy";
            case COMPLETED -> "complete";
        };
    }

    private String toRetryEligibility(RetryState retryState) {
        return switch (retryState.retryEligibility()) {
            case NOT_NEEDED -> "not-needed";
            case ELIGIBLE -> "pending";
        };
    }
}

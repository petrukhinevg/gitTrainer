package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.StartSessionResult;
import com.example.gittrainer.session.application.SubmitAnswerResult;
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
                        toRetryFeedbackResponse(0, null)
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
                toRetryFeedbackResponse(result.attemptNumber(), result.outcome())
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

    private RetryFeedbackResponse toRetryFeedbackResponse(int attemptNumber, SubmissionOutcome outcome) {
        String correctness = outcome == null ? null : outcome.correctness();
        String retryStateStatus;
        String eligibility;
        if (correctness == null) {
            retryStateStatus = "idle";
            eligibility = "not-needed";
        } else if ("correct".equals(correctness)) {
            retryStateStatus = "complete";
            eligibility = "not-needed";
        } else {
            retryStateStatus = "awaiting-policy";
            eligibility = "pending";
        }
        String explanationMessage = correctness == null
                ? "Retry guidance will mount here after the first evaluated submission."
                : "Retry explanation selection is reserved for the guided-retry epic tasks.";
        String hintMessage = correctness == null
                ? "Hint progression is idle until the learner receives evaluated feedback."
                : "Hint progression remains placeholder data until retry policy is connected.";

        return new RetryFeedbackResponse(
                "placeholder",
                new RetryStateResponse(retryStateStatus, attemptNumber, eligibility),
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
}

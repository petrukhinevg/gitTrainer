package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.StartedTrainingSession;
import com.example.gittrainer.session.application.SubmissionReceipt;
import com.example.gittrainer.session.domain.PlaceholderSubmissionOutcome;
import org.springframework.stereotype.Component;

@Component
public class SessionTransportResponseMapper {

    public SessionStartResponse toStartResponse(StartedTrainingSession startedTrainingSession) {
        return new SessionStartResponse(
                startedTrainingSession.sessionId(),
                startedTrainingSession.scenarioSlug(),
                startedTrainingSession.state().apiValue(),
                new SessionStartResponse.Transport(
                        "/api/sessions/%s/submissions".formatted(startedTrainingSession.sessionId()),
                        "validation-pending"
                )
        );
    }

    public SessionSubmissionResponse toSubmissionResponse(SubmissionReceipt submissionReceipt) {
        return new SessionSubmissionResponse(
                submissionReceipt.submissionId(),
                submissionReceipt.sessionId(),
                submissionReceipt.scenarioSlug(),
                submissionReceipt.attemptNumber(),
                submissionReceipt.state().apiValue(),
                toPlaceholderOutcome(submissionReceipt.outcome())
        );
    }

    private SessionSubmissionResponse.PlaceholderOutcome toPlaceholderOutcome(PlaceholderSubmissionOutcome outcome) {
        return new SessionSubmissionResponse.PlaceholderOutcome(
                outcome.type(),
                outcome.code(),
                outcome.message()
        );
    }
}

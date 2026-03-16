package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.validation.domain.SubmissionOutcome;

import java.util.List;

public record StartSessionResult(
        TrainingSession session,
        List<String> supportedAnswerTypes,
        SubmissionOutcome placeholderOutcome,
        RetryState retryState
) {

    public StartSessionResult {
        supportedAnswerTypes = supportedAnswerTypes == null ? List.of() : List.copyOf(supportedAnswerTypes);
    }
}

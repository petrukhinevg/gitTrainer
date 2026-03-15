package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.SubmissionPlaceholderOutcome;
import com.example.gittrainer.session.domain.TrainingSession;

import java.util.List;

public record StartSessionResult(
        TrainingSession session,
        List<String> supportedAnswerTypes,
        SubmissionPlaceholderOutcome placeholderOutcome
) {

    public StartSessionResult {
        supportedAnswerTypes = supportedAnswerTypes == null ? List.of() : List.copyOf(supportedAnswerTypes);
    }
}

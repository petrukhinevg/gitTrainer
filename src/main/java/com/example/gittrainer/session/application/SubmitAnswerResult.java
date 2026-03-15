package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.SubmissionPlaceholderOutcome;
import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.session.domain.TrainingSession;

import java.time.Instant;

public record SubmitAnswerResult(
        String submissionId,
        int attemptNumber,
        Instant submittedAt,
        TrainingSession session,
        SubmittedAnswer answer,
        SubmissionPlaceholderOutcome outcome
) {
}

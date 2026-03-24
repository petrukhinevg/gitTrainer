package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.session.domain.RetryGuidance;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import com.example.gittrainer.validation.domain.SubmissionTerminalOutput;

import java.time.Instant;

public record SubmitAnswerResult(
        String submissionId,
        int attemptNumber,
        Instant submittedAt,
        TrainingSession session,
        SubmittedAnswer answer,
        SubmissionOutcome outcome,
        SubmissionTerminalOutput terminalOutput,
        RetryState retryState,
        RetryGuidance retryGuidance
) {
}

package com.example.gittrainer.session.application;

import com.example.gittrainer.progress.application.ProgressRepository;
import com.example.gittrainer.progress.domain.ScenarioAttemptOutcome;
import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.session.domain.TrainingSessionSubmission;
import com.example.gittrainer.session.domain.RetryGuidance;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.session.domain.RetryStatePolicy;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class SubmitAnswerUseCase {

    private final SessionRepository sessionRepository;
    private final SessionSubmissionRepository sessionSubmissionRepository;
    private final SessionIdentityGenerator sessionIdentityGenerator;
    private final SubmissionAnswerValidator submissionAnswerValidator;
    private final ProgressRepository progressRepository;
    private final RetryGuidanceResolver retryGuidanceResolver;

    public SubmitAnswerUseCase(
            SessionRepository sessionRepository,
            SessionSubmissionRepository sessionSubmissionRepository,
            SessionIdentityGenerator sessionIdentityGenerator,
            SubmissionAnswerValidator submissionAnswerValidator,
            ProgressRepository progressRepository,
            RetryGuidanceResolver retryGuidanceResolver
    ) {
        this.sessionRepository = sessionRepository;
        this.sessionSubmissionRepository = sessionSubmissionRepository;
        this.sessionIdentityGenerator = sessionIdentityGenerator;
        this.submissionAnswerValidator = submissionAnswerValidator;
        this.progressRepository = progressRepository;
        this.retryGuidanceResolver = retryGuidanceResolver;
    }

    public SubmitAnswerResult submit(String sessionId, SubmitAnswerCommand command) {
        String normalizedSessionId = normalizeSessionId(sessionId);
        if (normalizedSessionId == null) {
            throw SessionRequestValidationException.missingSessionId();
        }
        if (command.answer().isBlank()) {
            throw SessionRequestValidationException.missingAnswer();
        }

        TrainingSession session = sessionRepository.findById(normalizedSessionId)
                .orElseThrow(() -> new SessionNotFoundException(normalizedSessionId));

        SubmittedAnswer submittedAnswer = new SubmittedAnswer(command.answerType(), command.answer());
        SubmissionOutcome outcome = submissionAnswerValidator.validate(session.scenarioSlug(), submittedAnswer);
        boolean failedAttempt = outcome.requiresRetry();
        String submissionId = sessionIdentityGenerator.nextSubmissionId();
        Instant submittedAt = Instant.now();
        TrainingSession updatedSession = sessionRepository
                .recordSubmission(normalizedSessionId, submissionId, failedAttempt)
                .orElseThrow(() -> new SessionNotFoundException(normalizedSessionId));
        sessionSubmissionRepository.save(new TrainingSessionSubmission(
                submissionId,
                updatedSession.sessionId(),
                updatedSession.scenarioSlug(),
                updatedSession.scenarioTitle(),
                updatedSession.scenarioSource(),
                updatedSession.submissionCount(),
                submittedAnswer.type(),
                submittedAnswer.value(),
                outcome.correctness(),
                submittedAt
        ));
        progressRepository.recordAttemptOutcome(new ScenarioAttemptOutcome(
                updatedSession.scenarioSlug(),
                updatedSession.scenarioTitle(),
                updatedSession.scenarioSource(),
                updatedSession.sessionId(),
                submissionId,
                outcome.correctness(),
                submittedAt
        ));
        RetryState retryState = RetryStatePolicy.afterSubmission(updatedSession, failedAttempt);
        RetryGuidance retryGuidance = retryGuidanceResolver.resolve(
                session.scenarioSlug(),
                outcome,
                retryState
        );

        return new SubmitAnswerResult(
                submissionId,
                updatedSession.submissionCount(),
                submittedAt,
                updatedSession,
                submittedAnswer,
                outcome,
                retryState,
                retryGuidance
        );
    }

    private String normalizeSessionId(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}

package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.SubmissionPlaceholderOutcome;
import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.session.domain.TrainingSession;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class SubmitAnswerUseCase {

    private final SessionRepository sessionRepository;
    private final SessionIdentityGenerator sessionIdentityGenerator;

    public SubmitAnswerUseCase(
            SessionRepository sessionRepository,
            SessionIdentityGenerator sessionIdentityGenerator
    ) {
        this.sessionRepository = sessionRepository;
        this.sessionIdentityGenerator = sessionIdentityGenerator;
    }

    public SubmitAnswerResult submit(String sessionId, SubmitAnswerCommand command) {
        String normalizedSessionId = normalizeSessionId(sessionId);
        if (normalizedSessionId == null) {
            throw SessionRequestValidationException.missingSessionId();
        }
        if (!SessionSubmissionAnswerTypes.isSupported(command.answerType())) {
            throw new UnsupportedSubmissionAnswerTypeException(
                    command.answerType(),
                    SessionSubmissionAnswerTypes.supportedAnswerTypes()
            );
        }
        if (command.answer().isBlank()) {
            throw SessionRequestValidationException.missingAnswer();
        }

        TrainingSession session = sessionRepository.findById(normalizedSessionId)
                .orElseThrow(() -> new SessionNotFoundException(normalizedSessionId));

        String submissionId = sessionIdentityGenerator.nextSubmissionId();
        TrainingSession updatedSession = session.recordSubmission(submissionId);
        sessionRepository.save(updatedSession);

        return new SubmitAnswerResult(
                submissionId,
                updatedSession.submissionCount(),
                Instant.now(),
                updatedSession,
                new SubmittedAnswer(command.answerType(), command.answer()),
                SubmissionPlaceholderOutcome.submissionAccepted()
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

package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class SubmitAnswerUseCase {

    private final SessionRepository sessionRepository;
    private final SessionIdentityGenerator sessionIdentityGenerator;
    private final SubmissionAnswerValidator submissionAnswerValidator;

    public SubmitAnswerUseCase(
            SessionRepository sessionRepository,
            SessionIdentityGenerator sessionIdentityGenerator,
            SubmissionAnswerValidator submissionAnswerValidator
    ) {
        this.sessionRepository = sessionRepository;
        this.sessionIdentityGenerator = sessionIdentityGenerator;
        this.submissionAnswerValidator = submissionAnswerValidator;
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
        String submissionId = sessionIdentityGenerator.nextSubmissionId();
        TrainingSession updatedSession = session.recordSubmission(submissionId);
        sessionRepository.save(updatedSession);

        return new SubmitAnswerResult(
                submissionId,
                updatedSession.submissionCount(),
                Instant.now(),
                updatedSession,
                submittedAnswer,
                outcome
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

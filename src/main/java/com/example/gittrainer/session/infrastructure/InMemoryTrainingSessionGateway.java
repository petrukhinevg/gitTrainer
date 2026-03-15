package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.StartedTrainingSession;
import com.example.gittrainer.session.application.SubmissionReceipt;
import com.example.gittrainer.session.application.TrainingSessionGateway;
import com.example.gittrainer.session.application.TrainingSessionNotFoundException;
import com.example.gittrainer.session.domain.PlaceholderSubmissionOutcome;
import com.example.gittrainer.session.domain.SessionLifecycleState;
import com.example.gittrainer.session.domain.StartTrainingSessionCommand;
import com.example.gittrainer.session.domain.SubmitTrainingSessionAnswerCommand;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class InMemoryTrainingSessionGateway implements TrainingSessionGateway {

    private final AtomicLong sessionSequence = new AtomicLong(1);
    private final AtomicLong submissionSequence = new AtomicLong(1);
    private final Map<String, StoredTrainingSession> sessions = new ConcurrentHashMap<>();

    @Override
    public StartedTrainingSession startSession(StartTrainingSessionCommand command) {
        String sessionId = "session-%03d".formatted(sessionSequence.getAndIncrement());
        StoredTrainingSession session = new StoredTrainingSession(
                sessionId,
                command.scenarioSlug(),
                SessionLifecycleState.ACTIVE,
                0
        );
        sessions.put(sessionId, session);
        return new StartedTrainingSession(session.sessionId(), session.scenarioSlug(), session.state());
    }

    @Override
    public SubmissionReceipt submitAnswer(SubmitTrainingSessionAnswerCommand command) {
        StoredTrainingSession currentSession = sessions.get(command.sessionId());
        if (currentSession == null) {
            throw new TrainingSessionNotFoundException(command.sessionId());
        }

        int nextAttemptNumber = currentSession.attemptNumber() + 1;
        StoredTrainingSession updatedSession = new StoredTrainingSession(
                currentSession.sessionId(),
                currentSession.scenarioSlug(),
                SessionLifecycleState.SUBMISSION_RECEIVED,
                nextAttemptNumber
        );
        sessions.put(updatedSession.sessionId(), updatedSession);

        return new SubmissionReceipt(
                "submission-%03d".formatted(submissionSequence.getAndIncrement()),
                updatedSession.sessionId(),
                updatedSession.scenarioSlug(),
                updatedSession.attemptNumber(),
                updatedSession.state(),
                resolvePlaceholderOutcome(command.answer())
        );
    }

    private PlaceholderSubmissionOutcome resolvePlaceholderOutcome(String answer) {
        if (answer.startsWith("git ")) {
            return new PlaceholderSubmissionOutcome(
                    "placeholder",
                    "command-text-received",
                    "Git command text was received through the submission transport boundary."
            );
        }

        return new PlaceholderSubmissionOutcome(
                "placeholder",
                "generic-answer-received",
                "Answer payload was received through the submission transport boundary."
        );
    }

    private record StoredTrainingSession(
            String sessionId,
            String scenarioSlug,
            SessionLifecycleState state,
            int attemptNumber
    ) {
    }
}

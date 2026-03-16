package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.SessionRepository;
import com.example.gittrainer.session.domain.TrainingSession;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemorySessionRepository implements SessionRepository {

    private final Map<String, TrainingSession> sessions = new ConcurrentHashMap<>();

    @Override
    public TrainingSession save(TrainingSession session) {
        sessions.put(session.sessionId(), session);
        return session;
    }

    @Override
    public Optional<TrainingSession> findById(String sessionId) {
        return Optional.ofNullable(sessions.get(sessionId));
    }

    @Override
    public Optional<TrainingSession> recordSubmission(String sessionId, String submissionId) {
        return Optional.ofNullable(sessions.computeIfPresent(
                sessionId,
                (ignored, existingSession) -> existingSession.recordSubmission(submissionId)
        ));
    }
}

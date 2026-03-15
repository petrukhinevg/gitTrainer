package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.TrainingSession;

import java.util.Optional;

public interface SessionRepository {

    TrainingSession save(TrainingSession session);

    Optional<TrainingSession> findById(String sessionId);
}

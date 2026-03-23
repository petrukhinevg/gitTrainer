package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.TrainingSessionSubmission;

import java.util.List;

public interface SessionSubmissionRepository {

    void save(TrainingSessionSubmission submission);

    List<TrainingSessionSubmission> findBySessionId(String sessionId);
}

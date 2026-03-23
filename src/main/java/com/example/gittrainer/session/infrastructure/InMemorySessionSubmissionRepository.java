package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.SessionSubmissionRepository;
import com.example.gittrainer.session.domain.TrainingSessionSubmission;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Profile("test | local-memory")
public class InMemorySessionSubmissionRepository implements SessionSubmissionRepository {

    private final Map<String, TrainingSessionSubmission> submissionsById = new ConcurrentHashMap<>();

    @Override
    public void save(TrainingSessionSubmission submission) {
        submissionsById.put(submission.submissionId(), submission);
    }

    @Override
    public List<TrainingSessionSubmission> findBySessionId(String sessionId) {
        return submissionsById.values().stream()
                .filter(submission -> submission.sessionId().equals(sessionId))
                .sorted(Comparator.comparingInt(TrainingSessionSubmission::attemptNumber))
                .toList();
    }
}

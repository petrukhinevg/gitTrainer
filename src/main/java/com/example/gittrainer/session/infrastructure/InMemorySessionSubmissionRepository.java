package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.SessionSubmissionRepository;
import com.example.gittrainer.session.domain.TrainingSessionSubmission;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

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
}

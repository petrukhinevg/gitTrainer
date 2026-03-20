package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.TrainingSessionSubmission;

public interface SessionSubmissionRepository {

    void save(TrainingSessionSubmission submission);
}

package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.SessionSubmissionRepository;
import com.example.gittrainer.session.domain.TrainingSessionSubmission;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;

@Repository
@Profile("!test & !local-memory")
public class PostgresSessionSubmissionRepository implements SessionSubmissionRepository {

    private final JdbcClient jdbcClient;

    public PostgresSessionSubmissionRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    @Override
    public void save(TrainingSessionSubmission submission) {
        jdbcClient.sql("""
                        INSERT INTO training_session_submissions (
                            submission_id,
                            session_id,
                            scenario_slug,
                            scenario_title,
                            scenario_source,
                            attempt_number,
                            answer_type,
                            answer_value,
                            correctness,
                            submitted_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """)
                .params(
                        submission.submissionId(),
                        submission.sessionId(),
                        submission.scenarioSlug(),
                        submission.scenarioTitle(),
                        submission.scenarioSource(),
                        submission.attemptNumber(),
                        submission.answerType(),
                        submission.answerValue(),
                        submission.correctness(),
                        Timestamp.from(submission.submittedAt())
                )
                .update();
    }
}

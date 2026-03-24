package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.SessionSubmissionRepository;
import com.example.gittrainer.session.domain.TrainingSessionSubmission;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
@Profile("!test")
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

    @Override
    public List<TrainingSessionSubmission> findBySessionId(String sessionId) {
        return jdbcClient.sql("""
                        SELECT submission_id,
                               session_id,
                               scenario_slug,
                               scenario_title,
                               scenario_source,
                               attempt_number,
                               answer_type,
                               answer_value,
                               correctness,
                               submitted_at
                        FROM training_session_submissions
                        WHERE session_id = ?
                        ORDER BY attempt_number
                        """)
                .param(sessionId)
                .query((resultSet, rowNum) -> new TrainingSessionSubmission(
                        resultSet.getString("submission_id"),
                        resultSet.getString("session_id"),
                        resultSet.getString("scenario_slug"),
                        resultSet.getString("scenario_title"),
                        resultSet.getString("scenario_source"),
                        resultSet.getInt("attempt_number"),
                        resultSet.getString("answer_type"),
                        resultSet.getString("answer_value"),
                        resultSet.getString("correctness"),
                        resultSet.getTimestamp("submitted_at").toInstant()
                ))
                .list();
    }
}

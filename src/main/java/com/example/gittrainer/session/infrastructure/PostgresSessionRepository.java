package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.SessionRepository;
import com.example.gittrainer.session.domain.SessionState;
import com.example.gittrainer.session.domain.TrainingSession;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

@Repository
@Profile({"postgres", "postgres-test"})
public class PostgresSessionRepository implements SessionRepository {

    private final JdbcClient jdbcClient;

    public PostgresSessionRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    @Override
    public TrainingSession save(TrainingSession session) {
        jdbcClient.sql("""
                        INSERT INTO training_sessions (
                            session_id,
                            scenario_slug,
                            scenario_title,
                            scenario_source,
                            started_at,
                            state,
                            submission_count,
                            consecutive_failure_count,
                            last_submission_id
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """)
                .params(
                        session.sessionId(),
                        session.scenarioSlug(),
                        session.scenarioTitle(),
                        session.scenarioSource(),
                        Timestamp.from(session.startedAt()),
                        session.state().name(),
                        session.submissionCount(),
                        session.consecutiveFailureCount(),
                        session.lastSubmissionId()
                )
                .update();
        return session;
    }

    @Override
    public Optional<TrainingSession> findById(String sessionId) {
        return jdbcClient.sql("""
                        SELECT session_id,
                               scenario_slug,
                               scenario_title,
                               scenario_source,
                               started_at,
                               state,
                               submission_count,
                               consecutive_failure_count,
                               last_submission_id
                        FROM training_sessions
                        WHERE session_id = ?
                        """)
                .param(sessionId)
                .query(this::mapSession)
                .optional();
    }

    @Override
    @Transactional
    public Optional<TrainingSession> recordSubmission(String sessionId, String submissionId, boolean failedAttempt) {
        int updatedRows = jdbcClient.sql("""
                        UPDATE training_sessions
                        SET submission_count = submission_count + 1,
                            consecutive_failure_count = CASE
                                WHEN ? THEN consecutive_failure_count + 1
                                ELSE 0
                            END,
                            last_submission_id = ?
                        WHERE session_id = ?
                        """)
                .params(failedAttempt, submissionId, sessionId)
                .update();
        if (updatedRows == 0) {
            return Optional.empty();
        }
        return findById(sessionId);
    }

    private TrainingSession mapSession(java.sql.ResultSet resultSet, int rowNum) throws java.sql.SQLException {
        return new TrainingSession(
                resultSet.getString("session_id"),
                resultSet.getString("scenario_slug"),
                resultSet.getString("scenario_title"),
                resultSet.getString("scenario_source"),
                toInstant(resultSet.getTimestamp("started_at")),
                SessionState.valueOf(resultSet.getString("state")),
                resultSet.getInt("submission_count"),
                resultSet.getInt("consecutive_failure_count"),
                resultSet.getString("last_submission_id")
        );
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}

package com.example.gittrainer.progress.infrastructure;

import com.example.gittrainer.progress.application.ProgressRepository;
import com.example.gittrainer.progress.domain.ScenarioAttemptOutcome;
import com.example.gittrainer.progress.domain.ScenarioAttemptStart;
import com.example.gittrainer.progress.domain.ScenarioCompletionEvent;
import com.example.gittrainer.progress.domain.ScenarioProgressRecord;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
@Profile({"postgres", "postgres-test"})
public class PostgresProgressRepository implements ProgressRepository {

    private final JdbcClient jdbcClient;

    public PostgresProgressRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    @Override
    @Transactional
    public ScenarioProgressRecord recordAttemptStart(ScenarioAttemptStart attemptStart) {
        int updatedRows = jdbcClient.sql("""
                        UPDATE scenario_progress
                        SET scenario_title = ?,
                            scenario_source = ?,
                            last_started_at = ?,
                            last_session_id = ?
                        WHERE scenario_slug = ?
                        """)
                .params(
                        attemptStart.scenarioTitle(),
                        attemptStart.scenarioSource(),
                        Timestamp.from(attemptStart.startedAt()),
                        attemptStart.sessionId(),
                        attemptStart.scenarioSlug()
                )
                .update();

        if (updatedRows == 0) {
            insertStartedProgress(attemptStart);
        }

        return findByScenarioSlug(attemptStart.scenarioSlug()).orElseThrow();
    }

    @Override
    @Transactional
    public ScenarioProgressRecord recordAttemptOutcome(ScenarioAttemptOutcome attemptOutcome) {
        ensureProgressExists(attemptOutcome);
        boolean completedAttempt = "correct".equals(attemptOutcome.correctness());

        jdbcClient.sql("""
                        UPDATE scenario_progress
                        SET scenario_title = ?,
                            scenario_source = ?,
                            last_submitted_at = ?,
                            last_session_id = ?,
                            last_submission_id = ?,
                            last_correctness = ?,
                            attempt_count = attempt_count + 1,
                            completion_count = completion_count + CASE WHEN ? THEN 1 ELSE 0 END,
                            last_completed_at = CASE WHEN ? THEN ? ELSE last_completed_at END
                        WHERE scenario_slug = ?
                        """)
                .params(
                        attemptOutcome.scenarioTitle(),
                        attemptOutcome.scenarioSource(),
                        Timestamp.from(attemptOutcome.submittedAt()),
                        attemptOutcome.sessionId(),
                        attemptOutcome.submissionId(),
                        attemptOutcome.correctness(),
                        completedAttempt,
                        completedAttempt,
                        Timestamp.from(attemptOutcome.submittedAt()),
                        attemptOutcome.scenarioSlug()
                )
                .update();

        if (completedAttempt) {
            jdbcClient.sql("""
                            INSERT INTO scenario_completion_events (
                                scenario_slug,
                                scenario_title,
                                scenario_source,
                                session_id,
                                submission_id,
                                completed_at
                            )
                            VALUES (?, ?, ?, ?, ?, ?)
                            """)
                    .params(
                            attemptOutcome.scenarioSlug(),
                            attemptOutcome.scenarioTitle(),
                            attemptOutcome.scenarioSource(),
                            attemptOutcome.sessionId(),
                            attemptOutcome.submissionId(),
                            Timestamp.from(attemptOutcome.submittedAt())
                    )
                    .update();
        }

        return findByScenarioSlug(attemptOutcome.scenarioSlug()).orElseThrow();
    }

    @Override
    public Optional<ScenarioProgressRecord> findByScenarioSlug(String scenarioSlug) {
        return jdbcClient.sql("""
                        SELECT scenario_slug,
                               scenario_title,
                               scenario_source,
                               first_started_at,
                               last_started_at,
                               last_submitted_at,
                               last_session_id,
                               last_submission_id,
                               last_correctness,
                               attempt_count,
                               completion_count,
                               last_completed_at
                        FROM scenario_progress
                        WHERE scenario_slug = ?
                        """)
                .param(scenarioSlug)
                .query(this::mapProgressRecord)
                .optional();
    }

    @Override
    public List<ScenarioProgressRecord> findAll() {
        return jdbcClient.sql("""
                        SELECT scenario_slug,
                               scenario_title,
                               scenario_source,
                               first_started_at,
                               last_started_at,
                               last_submitted_at,
                               last_session_id,
                               last_submission_id,
                               last_correctness,
                               attempt_count,
                               completion_count,
                               last_completed_at
                        FROM scenario_progress
                        """)
                .query(this::mapProgressRecord)
                .list();
    }

    @Override
    public List<ScenarioCompletionEvent> findCompletionEvents() {
        return jdbcClient.sql("""
                        SELECT scenario_slug,
                               scenario_title,
                               scenario_source,
                               session_id,
                               submission_id,
                               completed_at
                        FROM scenario_completion_events
                        ORDER BY completed_at DESC, id DESC
                        """)
                .query(this::mapCompletionEvent)
                .list();
    }

    private void ensureProgressExists(ScenarioAttemptOutcome attemptOutcome) {
        ScenarioAttemptStart attemptStart = new ScenarioAttemptStart(
                attemptOutcome.scenarioSlug(),
                attemptOutcome.scenarioTitle(),
                attemptOutcome.scenarioSource(),
                attemptOutcome.sessionId(),
                attemptOutcome.submittedAt()
        );
        if (findByScenarioSlug(attemptOutcome.scenarioSlug()).isEmpty()) {
            insertStartedProgress(attemptStart);
        }
    }

    private void insertStartedProgress(ScenarioAttemptStart attemptStart) {
        try {
            jdbcClient.sql("""
                            INSERT INTO scenario_progress (
                                scenario_slug,
                                scenario_title,
                                scenario_source,
                                first_started_at,
                                last_started_at,
                                last_submitted_at,
                                last_session_id,
                                last_submission_id,
                                last_correctness,
                                attempt_count,
                                completion_count,
                                last_completed_at
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """)
                    .params(
                            attemptStart.scenarioSlug(),
                            attemptStart.scenarioTitle(),
                            attemptStart.scenarioSource(),
                            Timestamp.from(attemptStart.startedAt()),
                            Timestamp.from(attemptStart.startedAt()),
                            null,
                            attemptStart.sessionId(),
                            null,
                            null,
                            0,
                            0,
                            null
                    )
                    .update();
        } catch (DuplicateKeyException ignored) {
            // Параллельный поток уже создал запись, это нормальный случай гонки.
        }
    }

    private ScenarioProgressRecord mapProgressRecord(java.sql.ResultSet resultSet, int rowNum) throws java.sql.SQLException {
        return new ScenarioProgressRecord(
                resultSet.getString("scenario_slug"),
                resultSet.getString("scenario_title"),
                resultSet.getString("scenario_source"),
                toInstant(resultSet.getTimestamp("first_started_at")),
                toInstant(resultSet.getTimestamp("last_started_at")),
                toInstant(resultSet.getTimestamp("last_submitted_at")),
                resultSet.getString("last_session_id"),
                resultSet.getString("last_submission_id"),
                resultSet.getString("last_correctness"),
                resultSet.getInt("attempt_count"),
                resultSet.getInt("completion_count"),
                toInstant(resultSet.getTimestamp("last_completed_at"))
        );
    }

    private ScenarioCompletionEvent mapCompletionEvent(java.sql.ResultSet resultSet, int rowNum) throws java.sql.SQLException {
        return new ScenarioCompletionEvent(
                resultSet.getString("scenario_slug"),
                resultSet.getString("scenario_title"),
                resultSet.getString("scenario_source"),
                resultSet.getString("session_id"),
                resultSet.getString("submission_id"),
                toInstant(resultSet.getTimestamp("completed_at"))
        );
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}

package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.validation.application.ValidationRunRepository;
import com.example.gittrainer.validation.domain.ValidationRunRecord;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;

@Repository
@Profile("!test")
public class PostgresValidationRunRepository implements ValidationRunRepository {

    private final JdbcClient jdbcClient;

    public PostgresValidationRunRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    @Override
    public void save(ValidationRunRecord validationRunRecord) {
        jdbcClient.sql("""
                        INSERT INTO validation_runs (
                            validation_run_id,
                            session_id,
                            submission_id,
                            scenario_slug,
                            answer_type,
                            answer_value,
                            validator_spec_id,
                            validator_type,
                            runner_kind,
                            runner_status,
                            outcome_status,
                            outcome_correctness,
                            outcome_code,
                            outcome_message,
                            duration_ms,
                            created_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """)
                .params(
                        validationRunRecord.validationRunId(),
                        validationRunRecord.sessionId(),
                        validationRunRecord.submissionId(),
                        validationRunRecord.scenarioSlug(),
                        validationRunRecord.answerType(),
                        validationRunRecord.answerValue(),
                        validationRunRecord.validatorSpecId(),
                        validationRunRecord.validatorType(),
                        validationRunRecord.runnerKind(),
                        validationRunRecord.runnerStatus(),
                        validationRunRecord.outcomeStatus(),
                        validationRunRecord.outcomeCorrectness(),
                        validationRunRecord.outcomeCode(),
                        validationRunRecord.outcomeMessage(),
                        validationRunRecord.durationMs(),
                        Timestamp.from(validationRunRecord.recordedAt())
                )
                .update();
    }
}

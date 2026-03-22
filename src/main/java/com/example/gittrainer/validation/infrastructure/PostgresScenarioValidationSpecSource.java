package com.example.gittrainer.validation.infrastructure;

import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.example.gittrainer.validation.application.ScenarioValidationSpec;
import com.example.gittrainer.validation.application.ScenarioValidationSpecSource;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@Profile("!test & !local-memory")
public class PostgresScenarioValidationSpecSource implements ScenarioValidationSpecSource {

    private final JdbcClient jdbcClient;

    public PostgresScenarioValidationSpecSource(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    @Override
    public Optional<ScenarioValidationSpec> findSpec(String scenarioSlug, String answerType) {
        PersistedSpec persistedSpec = jdbcClient.sql("""
                        SELECT validator_spec_id,
                               validator_type,
                               timeout_ms
                        FROM authored_scenario_validator_specs
                        WHERE scenario_slug = ?
                          AND answer_type = ?
                          AND enabled = TRUE
                        LIMIT 1
                        """)
                .params(scenarioSlug, answerType)
                .query((resultSet, rowNum) -> new PersistedSpec(
                        resultSet.getString("validator_spec_id"),
                        resultSet.getString("validator_type"),
                        resultSet.getLong("timeout_ms")
                ))
                .optional()
                .orElse(null);
        if (persistedSpec == null) {
            return Optional.empty();
        }

        List<ScenarioValidationRule> rules = jdbcClient.sql("""
                        SELECT match_type,
                               raw_match_value,
                               normalized_match_value,
                               outcome_correctness,
                               outcome_code,
                               outcome_message
                        FROM authored_scenario_validator_rules
                        WHERE validator_spec_id = ?
                        ORDER BY position
                        """)
                .param(persistedSpec.specId())
                .query((resultSet, rowNum) -> new ScenarioValidationRule(
                        resultSet.getString("match_type"),
                        resultSet.getString("raw_match_value"),
                        resultSet.getString("normalized_match_value"),
                        resultSet.getString("outcome_correctness"),
                        resultSet.getString("outcome_code"),
                        resultSet.getString("outcome_message")
                ))
                .list();

        return Optional.of(new ScenarioValidationSpec(
                persistedSpec.specId(),
                scenarioSlug,
                answerType,
                persistedSpec.validatorType(),
                persistedSpec.timeoutMs(),
                rules
        ));
    }

    private record PersistedSpec(
            String specId,
            String validatorType,
            long timeoutMs
    ) {
    }
}

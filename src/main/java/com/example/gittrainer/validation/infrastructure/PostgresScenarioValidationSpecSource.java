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
        List<ScenarioValidationRule> rules = jdbcClient.sql("""
                        SELECT normalized_answer_value,
                               outcome_correctness,
                               outcome_code,
                               outcome_message
                        FROM authored_scenario_answers
                        WHERE scenario_slug = ?
                          AND answer_type = ?
                        ORDER BY position
                        """)
                .params(scenarioSlug, answerType)
                .query((resultSet, rowNum) -> new ScenarioValidationRule(
                        resultSet.getString("normalized_answer_value"),
                        resultSet.getString("outcome_correctness"),
                        resultSet.getString("outcome_code"),
                        resultSet.getString("outcome_message")
                ))
                .list();

        if (rules.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(new ScenarioValidationSpec(
                scenarioSlug,
                answerType,
                "exact_command_match",
                rules
        ));
    }
}

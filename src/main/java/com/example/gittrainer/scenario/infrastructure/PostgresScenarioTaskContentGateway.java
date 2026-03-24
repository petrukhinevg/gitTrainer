package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.application.ScenarioTaskContentGateway;
import com.example.gittrainer.scenario.application.ScenarioTaskContentMissingException;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Primary
@Component
@Profile("!test")
public class PostgresScenarioTaskContentGateway implements ScenarioTaskContentGateway {

    private final JdbcClient jdbcClient;
    private final ScenarioPayloadJsonMapper jsonMapper;

    public PostgresScenarioTaskContentGateway(JdbcClient jdbcClient, ScenarioPayloadJsonMapper jsonMapper) {
        this.jdbcClient = jdbcClient;
        this.jsonMapper = jsonMapper;
    }

    @Override
    public ScenarioTaskContent loadTaskContent(String scenarioSlug) {
        return jdbcClient.sql("""
                        SELECT task_payload
                        FROM authored_scenarios
                        WHERE enabled = TRUE
                          AND scenario_slug = ?
                        """)
                .param(scenarioSlug)
                .query(String.class)
                .optional()
                .map(jsonMapper::readTaskContent)
                .orElseThrow(() -> new ScenarioTaskContentMissingException(scenarioSlug));
    }
}

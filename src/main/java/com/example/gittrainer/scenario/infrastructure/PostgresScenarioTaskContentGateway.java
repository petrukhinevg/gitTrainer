package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.application.ScenarioTaskContentGateway;
import com.example.gittrainer.scenario.application.ScenarioTaskContentNotAuthoredException;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Primary
@Component
@Profile("!test & !local-memory")
public class PostgresScenarioTaskContentGateway implements ScenarioTaskContentGateway {

    private final JdbcClient jdbcClient;
    private final AuthoredScenarioJsonMapper jsonMapper;

    public PostgresScenarioTaskContentGateway(JdbcClient jdbcClient, AuthoredScenarioJsonMapper jsonMapper) {
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
                .orElseThrow(() -> new ScenarioTaskContentNotAuthoredException(scenarioSlug));
    }
}

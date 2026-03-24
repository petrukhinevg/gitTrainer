package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioRepositoryContextGateway;
import com.example.gittrainer.scenario.application.ScenarioRepositoryContextNotAuthoredException;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Primary
@Component
@Profile("!test")
public class PostgresScenarioRepositoryContextGateway implements ScenarioRepositoryContextGateway {

    private final JdbcClient jdbcClient;
    private final AuthoredScenarioJsonMapper jsonMapper;

    public PostgresScenarioRepositoryContextGateway(JdbcClient jdbcClient, AuthoredScenarioJsonMapper jsonMapper) {
        this.jdbcClient = jdbcClient;
        this.jsonMapper = jsonMapper;
    }

    @Override
    public ScenarioWorkspaceDetail.ScenarioRepositoryContext loadRepositoryContext(String scenarioSlug) {
        return jdbcClient.sql("""
                        SELECT repository_context_payload
                        FROM authored_scenarios
                        WHERE enabled = TRUE
                          AND scenario_slug = ?
                        """)
                .param(scenarioSlug)
                .query(String.class)
                .optional()
                .map(jsonMapper::readRepositoryContext)
                .orElseThrow(() -> new ScenarioRepositoryContextNotAuthoredException(scenarioSlug));
    }
}

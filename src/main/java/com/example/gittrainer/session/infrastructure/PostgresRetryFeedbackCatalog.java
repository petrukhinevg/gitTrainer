package com.example.gittrainer.session.infrastructure;

import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryFeedbackCatalog;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Primary
@Component
@Profile("!test & !local-memory")
public class PostgresRetryFeedbackCatalog implements RetryFeedbackCatalog {

    private final JdbcClient jdbcClient;
    private final RetryFeedbackJsonMapper jsonMapper;

    public PostgresRetryFeedbackCatalog(JdbcClient jdbcClient, RetryFeedbackJsonMapper jsonMapper) {
        this.jdbcClient = jdbcClient;
        this.jsonMapper = jsonMapper;
    }

    @Override
    public Optional<RetryGuidanceProfile> findIncorrectGuidance(String scenarioSlug) {
        return jdbcClient.sql("""
                        SELECT incorrect_explanation_code,
                               incorrect_focus,
                               incorrect_hint_template_code
                        FROM authored_scenario_retry_guidance
                        WHERE scenario_slug = ?
                        """)
                .param(scenarioSlug)
                .query((resultSet, rowNum) -> new RetryGuidanceProfile(
                        resultSet.getString("incorrect_explanation_code"),
                        resultSet.getString("incorrect_focus"),
                        resultSet.getString("incorrect_hint_template_code")
                ))
                .optional();
    }

    @Override
    public Optional<RetryExplanationTemplate> findExplanationTemplate(String code) {
        return jdbcClient.sql("""
                        SELECT payload
                        FROM retry_feedback_templates
                        WHERE template_code = ?
                          AND template_type = 'explanation'
                        """)
                .param(code)
                .query(String.class)
                .optional()
                .map(jsonMapper::readExplanationTemplate);
    }

    @Override
    public Optional<RetryHintTemplate> findHintTemplate(String templateCode) {
        return jdbcClient.sql("""
                        SELECT payload
                        FROM retry_feedback_templates
                        WHERE template_code = ?
                          AND template_type = 'hint'
                        """)
                .param(templateCode)
                .query(String.class)
                .optional()
                .map(jsonMapper::readHintTemplate);
    }
}

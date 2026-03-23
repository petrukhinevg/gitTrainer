package db.migration;

import com.example.gittrainer.scenario.domain.ScenarioSummary;
import com.example.gittrainer.scenario.infrastructure.AuthoredScenarioResourceLoader;
import com.example.gittrainer.scenario.infrastructure.ScenarioCatalogFixture;
import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import com.example.gittrainer.session.infrastructure.AuthoredRetryFeedbackLibrary;
import com.example.gittrainer.validation.application.ScenarioValidationRule;
import com.example.gittrainer.validation.infrastructure.AuthoredScenarioValidationLibrary;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Map;

public class V9__authored_content_bootstrap extends BaseJavaMigration {

    private static final String DEFAULT_SOURCE_KEY = "default";
    private final ObjectMapper objectMapper = JsonMapper.builder()
            .findAndAddModules()
            .build();

    @Override
    public void migrate(Context context) throws Exception {
        AuthoredScenarioResourceLoader resourceLoader = new AuthoredScenarioResourceLoader();
        ScenarioCatalogFixture catalog = resourceLoader.defaultCatalog();
        Connection connection = context.getConnection();

        deleteExistingAuthoredData(connection);
        insertAuthoredScenarios(connection, resourceLoader, catalog);
        insertRetryFeedbackCatalog(connection);
    }

    private void deleteExistingAuthoredData(Connection connection) throws SQLException {
        try (PreparedStatement deleteTemplates = connection.prepareStatement("DELETE FROM retry_feedback_templates");
             PreparedStatement deleteScenarios = connection.prepareStatement("DELETE FROM authored_scenarios")) {
            deleteTemplates.executeUpdate();
            deleteScenarios.executeUpdate();
        }
    }

    private void insertAuthoredScenarios(
            Connection connection,
            AuthoredScenarioResourceLoader resourceLoader,
            ScenarioCatalogFixture catalog
    ) throws SQLException {
        for (ScenarioSummary summary : catalog.items()) {
            insertScenario(connection, resourceLoader, catalog.sourceName(), summary);
            insertAcceptedAnswers(connection, summary.slug());
            insertValidationSpec(connection, summary.slug());
            insertRetryGuidance(connection, summary.slug());
        }
    }

    private void insertScenario(
            Connection connection,
            AuthoredScenarioResourceLoader resourceLoader,
            String sourceName,
            ScenarioSummary summary
    ) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO authored_scenarios (
                    scenario_slug,
                    scenario_id,
                    source_key,
                    source_name,
                    title,
                    summary,
                    difficulty,
                    tags_json,
                    task_payload,
                    repository_context_payload,
                    enabled
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb), CAST(? AS jsonb), TRUE)
                """)) {
            statement.setString(1, summary.slug());
            statement.setString(2, summary.id());
            statement.setString(3, DEFAULT_SOURCE_KEY);
            statement.setString(4, sourceName);
            statement.setString(5, summary.title());
            statement.setString(6, summary.summary());
            statement.setString(7, summary.difficulty().name());
            statement.setString(8, writeJson(summary.tags()));
            statement.setString(9, writeJson(resourceLoader.taskContent(summary.slug())));
            statement.setString(10, writeJson(resourceLoader.repositoryContext(summary.slug())));
            statement.executeUpdate();
        }
    }

    private void insertAcceptedAnswers(Connection connection, String scenarioSlug) throws SQLException {
        AuthoredScenarioValidationLibrary.AuthoredScenarioValidationDefinition definition =
                requiredDefinition(scenarioSlug);
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO authored_scenario_answers (
                    scenario_slug,
                    position,
                    answer_type,
                    raw_answer_value,
                    normalized_answer_value,
                    outcome_correctness,
                    outcome_code,
                    outcome_message
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """)) {
            int position = 1;
            for (ScenarioValidationRule rule : definition.rules()) {
                statement.setString(1, scenarioSlug);
                statement.setInt(2, position++);
                statement.setString(3, "command_text");
                statement.setString(4, rule.rawMatchValue());
                statement.setString(5, rule.normalizedAnswerValue());
                statement.setString(6, rule.correctness());
                statement.setString(7, rule.code());
                statement.setString(8, rule.message());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    private void insertValidationSpec(Connection connection, String scenarioSlug) throws SQLException {
        AuthoredScenarioValidationLibrary.AuthoredScenarioValidationDefinition definition =
                requiredDefinition(scenarioSlug);
        String specId = "default:" + scenarioSlug + ":command_text";
        try (PreparedStatement specStatement = connection.prepareStatement("""
                INSERT INTO authored_scenario_validator_specs (
                    validator_spec_id,
                    scenario_slug,
                    answer_type,
                    validator_type,
                    timeout_ms,
                    config_payload,
                    enabled
                )
                VALUES (?, ?, ?, ?, ?, CAST(? AS jsonb), TRUE)
                """)) {
            specStatement.setString(1, specId);
            specStatement.setString(2, scenarioSlug);
            specStatement.setString(3, "command_text");
            specStatement.setString(4, definition.validatorType());
            specStatement.setInt(5, (int) AuthoredScenarioValidationLibrary.DEFAULT_VALIDATOR_TIMEOUT_MS);
            specStatement.setString(6, writeJson(definition.config()));
            specStatement.executeUpdate();
        }

        try (PreparedStatement ruleStatement = connection.prepareStatement("""
                INSERT INTO authored_scenario_validator_rules (
                    validator_spec_id,
                    position,
                    match_type,
                    raw_match_value,
                    normalized_match_value,
                    outcome_correctness,
                    outcome_code,
                    outcome_message
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """)) {
            int position = 1;
            for (ScenarioValidationRule rule : definition.rules()) {
                ruleStatement.setString(1, specId);
                ruleStatement.setInt(2, position++);
                ruleStatement.setString(3, rule.matchType());
                ruleStatement.setString(4, rule.rawMatchValue());
                ruleStatement.setString(5, rule.normalizedAnswerValue());
                ruleStatement.setString(6, rule.correctness());
                ruleStatement.setString(7, rule.code());
                ruleStatement.setString(8, rule.message());
                ruleStatement.addBatch();
            }
            ruleStatement.executeBatch();
        }
    }

    private void insertRetryGuidance(Connection connection, String scenarioSlug) throws SQLException {
        RetryGuidanceProfile profile = AuthoredRetryFeedbackLibrary.findIncorrectGuidance(scenarioSlug)
                .orElse(RetryGuidanceProfile.fallback());
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO authored_scenario_retry_guidance (
                    scenario_slug,
                    incorrect_explanation_code,
                    incorrect_focus,
                    incorrect_hint_template_code
                )
                VALUES (?, ?, ?, ?)
                """)) {
            statement.setString(1, scenarioSlug);
            statement.setString(2, profile.explanationCode());
            statement.setString(3, profile.focus());
            statement.setString(4, profile.hintTemplateCode());
            statement.executeUpdate();
        }
    }

    private void insertRetryFeedbackCatalog(Connection connection) throws SQLException {
        insertExplanationTemplates(connection);
        insertHintTemplates(connection);
    }

    private void insertExplanationTemplates(Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO retry_feedback_templates (
                    template_code,
                    template_type,
                    payload
                )
                VALUES (?, 'explanation', CAST(? AS jsonb))
                ON CONFLICT (template_code) DO NOTHING
                """)) {
            for (Map.Entry<String, RetryExplanationTemplate> entry
                    : AuthoredRetryFeedbackLibrary.explanationTemplates().entrySet()) {
                statement.setString(1, entry.getKey());
                statement.setString(2, writeJson(entry.getValue()));
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    private void insertHintTemplates(Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO retry_feedback_templates (
                    template_code,
                    template_type,
                    payload
                )
                VALUES (?, 'hint', CAST(? AS jsonb))
                ON CONFLICT (template_code) DO NOTHING
                """)) {
            for (Map.Entry<String, RetryHintTemplate> entry : AuthoredRetryFeedbackLibrary.hintTemplates().entrySet()) {
                statement.setString(1, entry.getKey());
                statement.setString(2, writeJson(entry.getValue()));
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    private AuthoredScenarioValidationLibrary.AuthoredScenarioValidationDefinition requiredDefinition(String scenarioSlug) {
        return AuthoredScenarioValidationLibrary.findDefinition(scenarioSlug)
                .orElseThrow(() -> new IllegalStateException(
                        "Не найдены authored validation definitions для сценария " + scenarioSlug
                ));
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось сериализовать authored bootstrap payload.", exception);
        }
    }
}

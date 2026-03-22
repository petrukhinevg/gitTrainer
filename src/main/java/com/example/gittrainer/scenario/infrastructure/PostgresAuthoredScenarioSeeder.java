package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import com.example.gittrainer.session.infrastructure.RetryFeedbackFixtureSource;
import com.example.gittrainer.session.infrastructure.RetryFeedbackJsonMapper;
import com.example.gittrainer.validation.infrastructure.FixtureSubmissionRuleLoader;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Component
@Profile("!test & !local-memory")
public class PostgresAuthoredScenarioSeeder implements ApplicationRunner {

    private static final String DEFAULT_SOURCE_KEY = "default";
    private static final int DEFAULT_VALIDATOR_TIMEOUT_MS = 5_000;

    private final JdbcClient jdbcClient;
    private final AuthoredScenarioJsonMapper jsonMapper;
    private final ScenarioCatalogFixtureSource scenarioCatalogFixtureSource;
    private final ScenarioTaskContentFixtureSource scenarioTaskContentFixtureSource;
    private final ScenarioRepositoryContextFixtureSource scenarioRepositoryContextFixtureSource;
    private final RetryFeedbackFixtureSource retryFeedbackFixtureSource;
    private final RetryFeedbackJsonMapper retryFeedbackJsonMapper;

    public PostgresAuthoredScenarioSeeder(
            JdbcClient jdbcClient,
            AuthoredScenarioJsonMapper jsonMapper,
            ScenarioCatalogFixtureSource scenarioCatalogFixtureSource,
            ScenarioTaskContentFixtureSource scenarioTaskContentFixtureSource,
            ScenarioRepositoryContextFixtureSource scenarioRepositoryContextFixtureSource,
            RetryFeedbackFixtureSource retryFeedbackFixtureSource,
            RetryFeedbackJsonMapper retryFeedbackJsonMapper
    ) {
        this.jdbcClient = jdbcClient;
        this.jsonMapper = jsonMapper;
        this.scenarioCatalogFixtureSource = scenarioCatalogFixtureSource;
        this.scenarioTaskContentFixtureSource = scenarioTaskContentFixtureSource;
        this.scenarioRepositoryContextFixtureSource = scenarioRepositoryContextFixtureSource;
        this.retryFeedbackFixtureSource = retryFeedbackFixtureSource;
        this.retryFeedbackJsonMapper = retryFeedbackJsonMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Map<String, List<String>> acceptedAnswersByScenario = FixtureSubmissionRuleLoader.loadRules();
        ScenarioCatalogFixture defaultCatalog = scenarioCatalogFixtureSource.defaultCatalog();

        for (ScenarioSummary summary : defaultCatalog.items()) {
            seedScenario(defaultCatalog.sourceName(), summary);
            seedAcceptedAnswers(summary.slug(), acceptedAnswersByScenario.get(summary.slug()));
            seedValidationSpec(summary.slug(), acceptedAnswersByScenario.get(summary.slug()));
            seedIncorrectGuidance(summary.slug(), retryFeedbackFixtureSource.findIncorrectGuidance(summary.slug())
                    .orElse(RetryGuidanceProfile.fallback()));
        }

        for (Map.Entry<String, RetryExplanationTemplate> entry
                : retryFeedbackFixtureSource.explanationTemplates().entrySet()) {
            seedExplanationTemplate(entry.getKey(), entry.getValue());
        }
        for (Map.Entry<String, RetryHintTemplate> entry
                : retryFeedbackFixtureSource.hintTemplates().entrySet()) {
            seedHintTemplate(entry.getKey(), entry.getValue());
        }
    }

    private void seedScenario(String sourceName, ScenarioSummary summary) {
        ScenarioTaskContent taskContent = scenarioTaskContentFixtureSource.loadTaskContent(summary.slug());
        ScenarioWorkspaceDetail.ScenarioRepositoryContext repositoryContext =
                scenarioRepositoryContextFixtureSource.loadRepositoryContext(summary.slug());

        jdbcClient.sql("""
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
                        ON CONFLICT (scenario_slug) DO NOTHING
                        """)
                .params(
                        summary.slug(),
                        summary.id(),
                        DEFAULT_SOURCE_KEY,
                        sourceName,
                        summary.title(),
                        summary.summary(),
                        summary.difficulty().name(),
                        jsonMapper.writeValue(summary.tags()),
                        jsonMapper.writeValue(taskContent),
                        jsonMapper.writeValue(repositoryContext)
                )
                .update();
    }

    private void seedAcceptedAnswers(String scenarioSlug, List<String> acceptedAnswers) {
        if (acceptedAnswers == null || acceptedAnswers.isEmpty()) {
            return;
        }

        for (int index = 0; index < acceptedAnswers.size(); index++) {
            String answer = acceptedAnswers.get(index);
            jdbcClient.sql("""
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
                            ON CONFLICT (scenario_slug, answer_type, normalized_answer_value) DO NOTHING
                            """)
                    .params(
                            scenarioSlug,
                            index + 1,
                            "command_text",
                            answer,
                            FixtureSubmissionRuleLoader.normalizeCommand(answer),
                            "correct",
                            "expected-command",
                            "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
                    )
                    .update();
        }
    }

    private void seedValidationSpec(String scenarioSlug, List<String> acceptedAnswers) {
        if (acceptedAnswers == null || acceptedAnswers.isEmpty()) {
            return;
        }

        String specId = validatorSpecId(scenarioSlug, "command_text");
        jdbcClient.sql("""
                        INSERT INTO authored_scenario_validator_specs (
                            validator_spec_id,
                            scenario_slug,
                            answer_type,
                            validator_type,
                            timeout_ms,
                            enabled
                        )
                        VALUES (?, ?, ?, ?, ?, TRUE)
                        ON CONFLICT (scenario_slug, answer_type) DO NOTHING
                        """)
                .params(
                        specId,
                        scenarioSlug,
                        "command_text",
                        "exact_command_match",
                        DEFAULT_VALIDATOR_TIMEOUT_MS
                )
                .update();

        for (int index = 0; index < acceptedAnswers.size(); index++) {
            String answer = acceptedAnswers.get(index);
            jdbcClient.sql("""
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
                            ON CONFLICT (validator_spec_id, normalized_match_value) DO NOTHING
                            """)
                    .params(
                            specId,
                            index + 1,
                            "exact_normalized_command",
                            answer,
                            FixtureSubmissionRuleLoader.normalizeCommand(answer),
                            "correct",
                            "expected-command",
                            "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
                    )
                    .update();
        }
    }

    private void seedIncorrectGuidance(String scenarioSlug, RetryGuidanceProfile profile) {
        jdbcClient.sql("""
                        INSERT INTO authored_scenario_retry_guidance (
                            scenario_slug,
                            incorrect_explanation_code,
                            incorrect_focus,
                            incorrect_hint_template_code
                        )
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT (scenario_slug) DO NOTHING
                        """)
                .params(
                        scenarioSlug,
                        profile.explanationCode(),
                        profile.focus(),
                        profile.hintTemplateCode()
                )
                .update();
    }

    private void seedExplanationTemplate(String templateCode, RetryExplanationTemplate template) {
        jdbcClient.sql("""
                        INSERT INTO retry_feedback_templates (
                            template_code,
                            template_type,
                            payload
                        )
                        VALUES (?, 'explanation', CAST(? AS jsonb))
                        ON CONFLICT (template_code) DO NOTHING
                        """)
                .params(
                        templateCode,
                        retryFeedbackJsonMapper.writeValue(template)
                )
                .update();
    }

    private void seedHintTemplate(String templateCode, RetryHintTemplate template) {
        jdbcClient.sql("""
                        INSERT INTO retry_feedback_templates (
                            template_code,
                            template_type,
                            payload
                        )
                        VALUES (?, 'hint', CAST(? AS jsonb))
                        ON CONFLICT (template_code) DO NOTHING
                        """)
                .params(
                        templateCode,
                        retryFeedbackJsonMapper.writeValue(template)
                )
                .update();
    }

    private String validatorSpecId(String scenarioSlug, String answerType) {
        return "default:" + scenarioSlug + ":" + answerType;
    }
}

package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import com.example.gittrainer.session.application.RetryExplanationTemplate;
import com.example.gittrainer.session.application.RetryHintTemplate;
import com.example.gittrainer.session.domain.RetryGuidanceProfile;
import com.example.gittrainer.session.infrastructure.RetryFeedbackFixtureSource;
import com.example.gittrainer.session.infrastructure.RetryFeedbackJsonMapper;
import com.example.gittrainer.validation.application.ScenarioValidationRule;
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

    private static final String BRANCH_SAFETY = "branch-safety";
    private static final String REMOTE_SYNC_PREVIEW = "remote-sync-preview";
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
                        ON CONFLICT (scenario_slug) DO UPDATE
                        SET scenario_id = EXCLUDED.scenario_id,
                            source_key = EXCLUDED.source_key,
                            source_name = EXCLUDED.source_name,
                            title = EXCLUDED.title,
                            summary = EXCLUDED.summary,
                            difficulty = EXCLUDED.difficulty,
                            tags_json = EXCLUDED.tags_json,
                            task_payload = EXCLUDED.task_payload,
                            repository_context_payload = EXCLUDED.repository_context_payload,
                            enabled = EXCLUDED.enabled
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
        String validatorType = validatorType(scenarioSlug);
        jdbcClient.sql("""
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
                        ON CONFLICT (scenario_slug, answer_type) DO NOTHING
                        """)
                .params(
                        specId,
                        scenarioSlug,
                        "command_text",
                        validatorType,
                        DEFAULT_VALIDATOR_TIMEOUT_MS,
                        validatorConfigPayload(scenarioSlug)
                )
                .update();

        List<ScenarioValidationRule> rules = validatorRules(scenarioSlug, acceptedAnswers);
        for (int index = 0; index < rules.size(); index++) {
            ScenarioValidationRule rule = rules.get(index);
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
                            rule.matchType(),
                            rule.rawMatchValue(),
                            rule.normalizedAnswerValue(),
                            rule.correctness(),
                            rule.code(),
                            rule.message()
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

    private String validatorConfigPayload(String scenarioSlug) {
        if (BRANCH_SAFETY.equals(scenarioSlug)) {
            return jsonMapper.writeValue(Map.of(
                    "expectedExitCode", 0,
                    "expectedStdout", "release/hotfix-7",
                    "workspaceTemplate", Map.of(
                            "initialBranch", "main",
                            "currentBranch", "release/hotfix-7",
                            "branches", List.of("release/hotfix-7", "feature/menu-refresh", "main"),
                            "committedFiles", List.of(
                                    Map.of(
                                            "path", "src/ui/header.css",
                                            "content", ".header { padding: 8px; }\n"
                                    ),
                                    Map.of(
                                            "path", "docs/release-checklist.md",
                                            "content", "- verify deploy\n"
                                    )
                            ),
                            "modifiedFiles", List.of(
                                    Map.of(
                                            "path", "src/ui/header.css",
                                            "content", ".header { padding: 12px; }\n"
                                    ),
                                    Map.of(
                                            "path", "docs/release-checklist.md",
                                            "content", "- verify deploy\n- smoke test\n"
                                    )
                            ),
                            "untrackedFiles", List.of()
                    )
            ));
        }
        if (REMOTE_SYNC_PREVIEW.equals(scenarioSlug)) {
            return jsonMapper.writeValue(Map.of(
                    "expectedExitCode", 0,
                    "workspaceTemplate", Map.of(
                            "initialBranch", "main",
                            "remoteName", "origin",
                            "localAheadCommitMessage", "local notes WIP",
                            "remoteAheadCommitMessage", "remote hotfix ready",
                            "baseFiles", List.of(
                                    Map.of(
                                            "path", "README.md",
                                            "content", "# Git Trainer\n"
                                    ),
                                    Map.of(
                                            "path", "docs/sync-playbook.md",
                                            "content", "- inspect divergence\n"
                                    )
                            ),
                            "localAheadFiles", List.of(
                                    Map.of(
                                            "path", "docs/local-notes.md",
                                            "content", "- pending local integration\n"
                                    )
                            ),
                            "remoteAheadFiles", List.of(
                                    Map.of(
                                            "path", "release/remote-hotfix.md",
                                            "content", "- hotfix available upstream\n"
                                    )
                            )
                    ),
                    "expectedState", Map.of(
                            "currentBranch", "main",
                            "localHeadCommitMessage", "local notes WIP",
                            "fetchHeadCommitMessage", "remote hotfix ready",
                            "remoteTrackingRefs", List.of(
                                    Map.of(
                                            "ref", "refs/remotes/origin/main",
                                            "commitMessage", "remote hotfix ready"
                                    )
                            )
                    )
            ));
        }

        return "{}";
    }

    private List<ScenarioValidationRule> validatorRules(String scenarioSlug, List<String> acceptedAnswers) {
        if (BRANCH_SAFETY.equals(scenarioSlug)) {
            return List.of(new ScenarioValidationRule(
                    "exact_normalized_command",
                    "git branch --show-current",
                    FixtureSubmissionRuleLoader.normalizeCommand("git branch --show-current"),
                    "correct",
                    "expected-command",
                    "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
            ));
        }

        return acceptedAnswers.stream()
                .map(answer -> new ScenarioValidationRule(
                        "exact_normalized_command",
                        answer,
                        FixtureSubmissionRuleLoader.normalizeCommand(answer),
                        "correct",
                        "expected-command",
                        "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
                ))
                .toList();
    }

    private String validatorType(String scenarioSlug) {
        if (BRANCH_SAFETY.equals(scenarioSlug)) {
            return "git_command_probe";
        }
        if (REMOTE_SYNC_PREVIEW.equals(scenarioSlug)) {
            return "git_repo_state_probe";
        }
        return "exact_command_match";
    }
}

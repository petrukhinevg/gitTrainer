package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioCatalogGateway;
import com.example.gittrainer.scenario.application.ScenarioTaskContent;
import com.example.gittrainer.scenario.application.ScenarioTaskContentGateway;
import com.example.gittrainer.scenario.application.ScenarioRepositoryContextGateway;
import com.example.gittrainer.scenario.domain.CatalogBrowseQuery;
import com.example.gittrainer.scenario.domain.ScenarioSummary;
import com.example.gittrainer.scenario.domain.ScenarioWorkspaceDetail;
import com.example.gittrainer.session.application.RetryFeedbackCatalog;
import com.example.gittrainer.session.application.RetryGuidanceResolver;
import com.example.gittrainer.session.domain.RetryGuidance;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.session.domain.StrongerHintEligibility;
import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.validation.application.SubmissionAnswerValidator;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("postgres")
@EnabledIfEnvironmentVariable(named = "RUN_POSTGRES_TESTS", matches = "true")
class PostgresAuthoredScenarioReadModelTest {

    @Autowired
    private ScenarioCatalogGateway scenarioCatalogGateway;

    @Autowired
    private ScenarioTaskContentGateway scenarioTaskContentGateway;

    @Autowired
    private ScenarioRepositoryContextGateway scenarioRepositoryContextGateway;

    @Autowired
    private SubmissionAnswerValidator submissionAnswerValidator;

    @Autowired
    private RetryFeedbackCatalog retryFeedbackCatalog;

    @Autowired
    private RetryGuidanceResolver retryGuidanceResolver;

    @Autowired
    private JdbcClient jdbcClient;

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
                () -> envOrDefault("POSTGRES_TEST_URL", "jdbc:postgresql://localhost:5432/git_trainer"));
        registry.add("spring.datasource.username", () -> envOrDefault("POSTGRES_TEST_USER", "git_trainer"));
        registry.add("spring.datasource.password", () -> envOrDefault("POSTGRES_TEST_PASSWORD", "git_trainer"));
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Test
    void exposesSeededAuthoredScenariosFromDatabase() {
        CatalogBrowseQuery query = new CatalogBrowseQuery(null, null, null, null);

        List<ScenarioSummary> catalog = scenarioCatalogGateway.loadCatalog(query);
        ScenarioTaskContent taskContent = scenarioTaskContentGateway.loadTaskContent("status-basics");
        ScenarioWorkspaceDetail.ScenarioRepositoryContext repositoryContext =
                scenarioRepositoryContextGateway.loadRepositoryContext("status-basics");
        Long scenarioCount = jdbcClient.sql("SELECT COUNT(*) FROM authored_scenarios")
                .query(Long.class)
                .single();
        Long answerCount = jdbcClient.sql("SELECT COUNT(*) FROM authored_scenario_answers")
                .query(Long.class)
                .single();
        Long validatorSpecCount = jdbcClient.sql("SELECT COUNT(*) FROM authored_scenario_validator_specs")
                .query(Long.class)
                .single();
        Long validatorRuleCount = jdbcClient.sql("SELECT COUNT(*) FROM authored_scenario_validator_rules")
                .query(Long.class)
                .single();
        String remoteSyncValidatorType = jdbcClient.sql("""
                        SELECT validator_type
                        FROM authored_scenario_validator_specs
                        WHERE scenario_slug = 'remote-sync-preview'
                          AND answer_type = 'command_text'
                        """)
                .query(String.class)
                .single();

        assertThat(scenarioCatalogGateway.sourceName(query)).isEqualTo("mvp-fixture");
        assertThat(catalog)
                .extracting(ScenarioSummary::slug)
                .contains("status-basics", "branch-safety", "history-cleanup-preview", "remote-sync-preview");
        assertThat(taskContent.goal()).contains("рабочего дерева");
        assertThat(taskContent.instructions()).hasSize(3);
        assertThat(repositoryContext.branches()).extracting(ScenarioWorkspaceDetail.ScenarioRepositoryBranch::name)
                .contains("main");
        assertThat(repositoryContext.files()).extracting(ScenarioWorkspaceDetail.ScenarioRepositoryFile::status)
                .contains("modified", "untracked");
        assertThat(scenarioCount).isGreaterThanOrEqualTo(4);
        assertThat(answerCount).isGreaterThanOrEqualTo(12);
        assertThat(validatorSpecCount).isGreaterThanOrEqualTo(4);
        assertThat(validatorRuleCount).isGreaterThanOrEqualTo(12);
        assertThat(remoteSyncValidatorType).isEqualTo("git_repo_state_probe");
    }

    @Test
    void validatesAnswersUsingDatabaseBackedValidatorSpecs() {
        SubmissionOutcome correctOutcome = submissionAnswerValidator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git status --short")
        ).outcome();
        SubmissionOutcome incorrectOutcome = submissionAnswerValidator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git checkout main")
        ).outcome();
        SubmissionOutcome missingRuleOutcome = submissionAnswerValidator.validate(
                "unknown-scenario",
                new SubmittedAnswer("command_text", "git status")
        ).outcome();

        assertThat(correctOutcome.correctness()).isEqualTo("correct");
        assertThat(correctOutcome.code()).isEqualTo("expected-command");
        assertThat(incorrectOutcome.correctness()).isEqualTo("incorrect");
        assertThat(incorrectOutcome.code()).isEqualTo("unexpected-command");
        assertThat(missingRuleOutcome.correctness()).isEqualTo("incorrect");
        assertThat(missingRuleOutcome.code()).isEqualTo("validation-rule-missing");
    }

    @Test
    void rendersRetryFeedbackUsingDatabaseBackedProfilesAndTemplates() {
        SubmissionOutcome outcome = SubmissionOutcome.incorrect(
                "unexpected-command",
                "Отправленная команда не совпадает с ожидаемым безопасным следующим шагом для этого сценария."
        );
        RetryState retryState = RetryState.retryAvailable(1, 1, StrongerHintEligibility.LOCKED);
        RetryGuidance retryGuidance = retryGuidanceResolver.resolve("remote-sync-preview", outcome, retryState);

        assertThat(retryFeedbackCatalog.findIncorrectGuidance("remote-sync-preview")).isPresent();
        assertThat(retryFeedbackCatalog.findExplanationTemplate(
                "remote-sync-requires-fetch-first"
        )).isPresent();
        assertThat(retryFeedbackCatalog.findHintTemplate("remote-fetch")).isPresent();
        assertThat(retryGuidance.explanation().code()).isEqualTo("remote-sync-requires-fetch-first");
        assertThat(retryGuidance.hint().code()).isEqualTo("remote-fetch-nudge");
    }

    private static String envOrDefault(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}

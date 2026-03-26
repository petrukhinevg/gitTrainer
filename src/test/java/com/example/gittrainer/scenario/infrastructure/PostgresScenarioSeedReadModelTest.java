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
class PostgresScenarioSeedReadModelTest {

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
                () -> envOrDefault("POSTGRES_TEST_URL", "jdbc:postgresql://localhost:5433/git_trainer"));
        registry.add("spring.datasource.username", () -> envOrDefault("POSTGRES_TEST_USER", "git_trainer"));
        registry.add("spring.datasource.password", () -> envOrDefault("POSTGRES_TEST_PASSWORD", "git_trainer"));
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Test
    void exposesSeededScenariosFromDatabase() {
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
        Long probeValidatorSpecCount = jdbcClient.sql("""
                        SELECT COUNT(*)
                        FROM authored_scenario_validator_specs
                        WHERE answer_type = 'command_text'
                          AND validator_type IN ('git_command_probe', 'git_repo_state_probe')
                        """)
                .query(Long.class)
                .single();

        assertThat(scenarioCatalogGateway.sourceName(query)).isEqualTo("db-seeded");
        assertThat(catalog)
                .extracting(ScenarioSummary::slug)
                .contains(
                        "status-basics",
                        "branch-safety",
                        "history-cleanup-preview",
                        "remote-sync-preview",
                        "stash-checkpoint-draft",
                        "merge-sandbox-outline",
                        "tag-checkpoint-preview"
                );
        assertThat(taskContent.goal()).contains("`main`");
        assertThat(taskContent.instructions()).hasSize(3);
        assertThat(repositoryContext.branches()).extracting(ScenarioWorkspaceDetail.ScenarioRepositoryBranch::name)
                .contains("main");
        assertThat(repositoryContext.files()).extracting(ScenarioWorkspaceDetail.ScenarioRepositoryFile::status)
                .contains("modified", "untracked");
        assertThat(scenarioCount).isGreaterThanOrEqualTo(7);
        assertThat(answerCount).isGreaterThanOrEqualTo(23);
        assertThat(validatorSpecCount).isGreaterThanOrEqualTo(7);
        assertThat(validatorRuleCount).isGreaterThanOrEqualTo(23);
        assertThat(probeValidatorSpecCount).isGreaterThanOrEqualTo(7);
    }

    @Test
    void validatesAnswersUsingDatabaseBackedValidatorSpecs() {
        SubmissionOutcome statusPartialOutcome = submissionAnswerValidator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git status")
        ).outcome();
        SubmissionOutcome correctOutcome = submissionAnswerValidator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git status --short")
        ).outcome();
        SubmissionOutcome branchPartialOutcome = submissionAnswerValidator.validate(
                "branch-safety",
                new SubmittedAnswer("command_text", "git branch --show-current")
        ).outcome();
        SubmissionOutcome branchCorrectOutcome = submissionAnswerValidator.validate(
                null,
                "branch-safety",
                List.of(new SubmittedAnswer("command_text", "git branch --show-current")),
                new SubmittedAnswer("command_text", "git status -sb")
        ).outcome();
        SubmissionOutcome historyPartialOutcome = submissionAnswerValidator.validate(
                "history-cleanup-preview",
                new SubmittedAnswer("command_text", "git log --oneline --decorate")
        ).outcome();
        SubmissionOutcome historyCorrectOutcome = submissionAnswerValidator.validate(
                "history-cleanup-preview",
                new SubmittedAnswer("command_text", "git log --oneline --graph --decorate")
        ).outcome();
        SubmissionOutcome partialOutcome = submissionAnswerValidator.validate(
                null,
                "stash-checkpoint-draft",
                List.of(),
                new SubmittedAnswer("command_text", "git status -sb")
        ).outcome();
        SubmissionOutcome stashCorrectOutcome = submissionAnswerValidator.validate(
                null,
                "stash-checkpoint-draft",
                List.of(new SubmittedAnswer("command_text", "git status -sb")),
                new SubmittedAnswer("command_text", "git stash push -u")
        ).outcome();
        SubmissionOutcome tagCorrectOutcome = submissionAnswerValidator.validate(
                "tag-checkpoint-preview",
                new SubmittedAnswer("command_text", "git show-ref --tags")
        ).outcome();
        SubmissionOutcome incorrectOutcome = submissionAnswerValidator.validate(
                "status-basics",
                new SubmittedAnswer("command_text", "git checkout main")
        ).outcome();
        SubmissionOutcome missingRuleOutcome = submissionAnswerValidator.validate(
                "unknown-scenario",
                new SubmittedAnswer("command_text", "git status")
        ).outcome();

        assertThat(statusPartialOutcome.correctness()).isEqualTo("partial");
        assertThat(statusPartialOutcome.code()).isEqualTo("working-tree-inspected");
        assertThat(correctOutcome.correctness()).isEqualTo("correct");
        assertThat(correctOutcome.code()).isEqualTo("expected-command");
        assertThat(branchPartialOutcome.correctness()).isEqualTo("partial");
        assertThat(branchPartialOutcome.code()).isEqualTo("branch-context-confirmed");
        assertThat(branchCorrectOutcome.correctness()).isEqualTo("correct");
        assertThat(branchCorrectOutcome.code()).isEqualTo("expected-command");
        assertThat(historyPartialOutcome.correctness()).isEqualTo("partial");
        assertThat(historyPartialOutcome.code()).isEqualTo("history-preview-opened");
        assertThat(historyCorrectOutcome.correctness()).isEqualTo("correct");
        assertThat(historyCorrectOutcome.code()).isEqualTo("expected-command");
        assertThat(partialOutcome.correctness()).isEqualTo("partial");
        assertThat(partialOutcome.code()).isEqualTo("workspace-inspected");
        assertThat(stashCorrectOutcome.correctness()).isEqualTo("correct");
        assertThat(stashCorrectOutcome.code()).isEqualTo("expected-command");
        assertThat(tagCorrectOutcome.correctness()).isEqualTo("correct");
        assertThat(tagCorrectOutcome.code()).isEqualTo("expected-command");
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

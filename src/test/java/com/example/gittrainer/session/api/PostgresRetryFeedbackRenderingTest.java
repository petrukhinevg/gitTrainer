package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.RetryGuidanceResolver;
import com.example.gittrainer.session.application.SubmitAnswerResult;
import com.example.gittrainer.session.domain.RetryGuidance;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.session.domain.SessionState;
import com.example.gittrainer.session.domain.StrongerHintEligibility;
import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("postgres")
@EnabledIfEnvironmentVariable(named = "RUN_POSTGRES_TESTS", matches = "true")
class PostgresRetryFeedbackRenderingTest {

    @Autowired
    private RetryGuidanceResolver retryGuidanceResolver;

    @Autowired
    private SessionResponseMapper sessionResponseMapper;

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
                () -> envOrDefault("POSTGRES_TEST_URL", "jdbc:postgresql://localhost:5432/git_trainer"));
        registry.add("spring.datasource.username", () -> envOrDefault("POSTGRES_TEST_USER", "git_trainer"));
        registry.add("spring.datasource.password", () -> envOrDefault("POSTGRES_TEST_PASSWORD", "git_trainer"));
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Test
    void rendersGuidedRetryFeedbackUsingDatabaseTemplates() {
        SubmissionOutcome outcome = SubmissionOutcome.incorrect(
                "unexpected-command",
                "Отправленная команда не совпадает с ожидаемым безопасным следующим шагом для этого сценария."
        );
        RetryState retryState = RetryState.retryAvailable(1, 1, StrongerHintEligibility.LOCKED);
        RetryGuidance retryGuidance = retryGuidanceResolver.resolve("remote-sync-preview", outcome, retryState);

        SessionSubmissionResponse response = sessionResponseMapper.toSubmissionResponse(new SubmitAnswerResult(
                "submission-db-1",
                1,
                Instant.parse("2026-03-22T07:00:00Z"),
                new TrainingSession(
                        "session-db-1",
                        "remote-sync-preview",
                        "Сначала обнови удалённое состояние",
                        "mvp-fixture",
                        Instant.parse("2026-03-22T07:00:00Z"),
                        SessionState.ACTIVE,
                        1,
                        1,
                        "submission-db-1"
                ),
                new SubmittedAnswer("command_text", "git pull"),
                outcome,
                retryState,
                retryGuidance
        ));

        assertThat(response.retryFeedback().explanation().title())
                .isEqualTo("Сначала обновите удалённое состояние, потом интегрируйте");
        assertThat(response.retryFeedback().hint().reveals().getFirst().title())
                .isEqualTo("Сначала получите свежие remote refs");
    }

    private static String envOrDefault(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}

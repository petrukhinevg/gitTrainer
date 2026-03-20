package com.example.gittrainer.progress.infrastructure;

import com.example.gittrainer.progress.application.ProgressRepository;
import com.example.gittrainer.progress.domain.ScenarioCompletionEvent;
import com.example.gittrainer.progress.domain.ScenarioProgressRecord;
import com.example.gittrainer.session.application.SessionRepository;
import com.example.gittrainer.session.application.StartSessionCommand;
import com.example.gittrainer.session.application.StartSessionResult;
import com.example.gittrainer.session.application.StartSessionUseCase;
import com.example.gittrainer.session.application.SubmitAnswerCommand;
import com.example.gittrainer.session.application.SubmitAnswerResult;
import com.example.gittrainer.session.application.SubmitAnswerUseCase;
import com.example.gittrainer.session.domain.TrainingSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("postgres")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@EnabledIfEnvironmentVariable(named = "RUN_POSTGRES_TESTS", matches = "true")
class PostgresPersistenceFlowTest {

    @Autowired
    private StartSessionUseCase startSessionUseCase;

    @Autowired
    private SubmitAnswerUseCase submitAnswerUseCase;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private ProgressRepository progressRepository;

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

    @BeforeEach
    void resetDatabaseState() {
        jdbcClient.sql("""
                        TRUNCATE TABLE scenario_completion_events,
                                       scenario_progress,
                                       training_session_submissions,
                                       training_sessions
                        RESTART IDENTITY
                        """)
                .update();
    }

    @Test
    void persistsSessionAndProgressStateInDatabaseBackedRepositories() {
        StartSessionResult startedSession = startSessionUseCase.start(new StartSessionCommand("status-basics", null));
        String sessionId = startedSession.session().sessionId();

        SubmitAnswerResult incorrectAttempt = submitAnswerUseCase.submit(
                sessionId,
                new SubmitAnswerCommand("command_text", "git checkout main")
        );
        SubmitAnswerResult correctAttempt = submitAnswerUseCase.submit(
                sessionId,
                new SubmitAnswerCommand("command_text", "git status")
        );

        TrainingSession storedSession = sessionRepository.findById(sessionId).orElseThrow();
        ScenarioProgressRecord progressRecord = progressRepository.findByScenarioSlug("status-basics").orElseThrow();
        List<ScenarioCompletionEvent> completionEvents = progressRepository.findCompletionEvents().stream()
                .filter(item -> sessionId.equals(item.sessionId()))
                .toList();
        Integer persistedSubmissionCount = jdbcClient.sql("""
                        SELECT COUNT(*)
                        FROM training_session_submissions
                        WHERE session_id = ?
                        """)
                .param(sessionId)
                .query(Integer.class)
                .single();
        PersistedSubmission latestPersistedSubmission = jdbcClient.sql("""
                        SELECT submission_id,
                               attempt_number,
                               answer_type,
                               answer_value,
                               correctness
                        FROM training_session_submissions
                        WHERE session_id = ?
                        ORDER BY attempt_number DESC
                        LIMIT 1
                        """)
                .param(sessionId)
                .query((resultSet, ignored) -> new PersistedSubmission(
                        resultSet.getString("submission_id"),
                        resultSet.getInt("attempt_number"),
                        resultSet.getString("answer_type"),
                        resultSet.getString("answer_value"),
                        resultSet.getString("correctness")
                ))
                .single();

        assertThat(storedSession.submissionCount()).isEqualTo(2);
        assertThat(storedSession.consecutiveFailureCount()).isZero();
        assertThat(storedSession.lastSubmissionId()).isEqualTo(correctAttempt.submissionId());
        assertThat(persistedSubmissionCount).isEqualTo(2);
        assertThat(latestPersistedSubmission.submissionId()).isEqualTo(correctAttempt.submissionId());
        assertThat(latestPersistedSubmission.attemptNumber()).isEqualTo(correctAttempt.attemptNumber());
        assertThat(latestPersistedSubmission.answerType()).isEqualTo("command_text");
        assertThat(latestPersistedSubmission.answerValue()).isEqualTo("git status");
        assertThat(latestPersistedSubmission.correctness()).isEqualTo("correct");

        assertThat(progressRecord.attemptCount()).isEqualTo(2);
        assertThat(progressRecord.completionCount()).isEqualTo(1);
        assertThat(progressRecord.lastSubmissionId()).isEqualTo(correctAttempt.submissionId());
        assertThat(progressRecord.lastCorrectness()).isEqualTo("correct");
        assertThat(progressRecord.lastSubmittedAt()).isEqualTo(correctAttempt.submittedAt());

        assertThat(completionEvents).hasSize(1);
        assertThat(completionEvents.getFirst().submissionId()).isEqualTo(correctAttempt.submissionId());
        assertThat(completionEvents.getFirst().completedAt()).isEqualTo(correctAttempt.submittedAt());
        assertThat(incorrectAttempt.outcome().correctness()).isEqualTo("incorrect");
    }

    private static String envOrDefault(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    private record PersistedSubmission(
            String submissionId,
            int attemptNumber,
            String answerType,
            String answerValue,
            String correctness
    ) {
    }
}

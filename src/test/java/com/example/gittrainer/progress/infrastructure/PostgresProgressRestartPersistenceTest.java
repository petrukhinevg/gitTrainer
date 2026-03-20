package com.example.gittrainer.progress.infrastructure;

import com.example.gittrainer.progress.api.ProgressController;
import com.example.gittrainer.progress.api.ProgressSummaryItemResponse;
import com.example.gittrainer.progress.api.ProgressSummaryResponse;
import com.example.gittrainer.progress.application.LoadProgressSummaryUseCase;
import com.example.gittrainer.progress.application.ProgressRepository;
import com.example.gittrainer.progress.domain.ScenarioProgressRecord;
import com.example.gittrainer.session.application.StartSessionCommand;
import com.example.gittrainer.session.application.StartSessionUseCase;
import com.example.gittrainer.session.application.SubmitAnswerCommand;
import com.example.gittrainer.session.application.SubmitAnswerUseCase;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("postgres")
@EnabledIfEnvironmentVariable(named = "RUN_POSTGRES_TESTS", matches = "true")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PostgresProgressRestartPersistenceTest {

    @Autowired
    private StartSessionUseCase startSessionUseCase;

    @Autowired
    private SubmitAnswerUseCase submitAnswerUseCase;

    @Autowired
    private ProgressRepository progressRepository;

    @Autowired
    private LoadProgressSummaryUseCase loadProgressSummaryUseCase;

    @Autowired
    private ProgressController progressController;

    @Autowired
    private JdbcClient jdbcClient;

    @Test
    @Order(1)
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
    void writesProgressBeforeRestart() {
        jdbcClient.sql("""
                        TRUNCATE TABLE scenario_completion_events,
                                       scenario_progress,
                                       training_sessions
                        RESTART IDENTITY CASCADE
                        """)
                .update();

        String sessionId = startSessionUseCase.start(new StartSessionCommand("status-basics", null))
                .session()
                .sessionId();
        submitAnswerUseCase.submit(
                sessionId,
                new SubmitAnswerCommand("command_text", "git status")
        );

        ScenarioProgressRecord progressRecord = progressRepository.findByScenarioSlug("status-basics").orElseThrow();
        assertThat(progressRecord.attemptCount()).isEqualTo(1);
        assertThat(progressRecord.completionCount()).isEqualTo(1);
    }

    @Test
    @Order(2)
    void keepsProgressAfterRestartAndServesItThroughProgressBoundary() {
        ScenarioProgressRecord progressRecord = progressRepository.findByScenarioSlug("status-basics").orElseThrow();
        assertThat(progressRecord.attemptCount()).isEqualTo(1);
        assertThat(progressRecord.completionCount()).isEqualTo(1);
        assertThat(progressRecord.lastCorrectness()).isEqualTo("correct");

        ProgressSummaryResponse progressSummaryResponse = progressController.loadProgressSummary();
        ProgressSummaryItemResponse statusBasics = progressSummaryResponse.items().stream()
                .filter(item -> "status-basics".equals(item.scenarioSlug()))
                .findFirst()
                .orElseThrow();

        assertThat(statusBasics.attemptCount()).isEqualTo(1);
        assertThat(statusBasics.completionCount()).isEqualTo(1);
        assertThat(statusBasics.status()).isEqualTo("completed");

        assertThat(loadProgressSummaryUseCase.load().recentActivity())
                .extracting(item -> item.scenarioSlug())
                .contains("status-basics");
    }
}

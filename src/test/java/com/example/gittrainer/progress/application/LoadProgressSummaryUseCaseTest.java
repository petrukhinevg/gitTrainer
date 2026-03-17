package com.example.gittrainer.progress.application;

import com.example.gittrainer.session.application.StartSessionCommand;
import com.example.gittrainer.session.application.StartSessionUseCase;
import com.example.gittrainer.session.application.SubmitAnswerCommand;
import com.example.gittrainer.session.application.SubmitAnswerUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class LoadProgressSummaryUseCaseTest {

    @Autowired
    private LoadProgressSummaryUseCase loadProgressSummaryUseCase;

    @Autowired
    private StartSessionUseCase startSessionUseCase;

    @Autowired
    private SubmitAnswerUseCase submitAnswerUseCase;

    @Test
    void derivesNotStartedInProgressAndCompletedStatusesFromRecordedProgress() {
        String statusSessionId = startSessionUseCase.start(new StartSessionCommand("status-basics", null))
                .session()
                .sessionId();
        String branchSessionId = startSessionUseCase.start(new StartSessionCommand("branch-safety", null))
                .session()
                .sessionId();

        submitAnswerUseCase.submit(
                statusSessionId,
                new SubmitAnswerCommand("command_text", "git status")
        );
        submitAnswerUseCase.submit(
                branchSessionId,
                new SubmitAnswerCommand("command_text", "git checkout main")
        );

        ProgressSummary summary = loadProgressSummaryUseCase.load();

        ProgressSummaryItem branchSafety = findItem(summary, "branch-safety");
        ProgressSummaryItem historyCleanup = findItem(summary, "history-cleanup-preview");
        ProgressSummaryItem statusBasics = findItem(summary, "status-basics");

        assertThat(branchSafety.status().name()).isEqualTo("IN_PROGRESS");
        assertThat(branchSafety.attemptCount()).isEqualTo(1);
        assertThat(branchSafety.completionCount()).isZero();

        assertThat(statusBasics.status().name()).isEqualTo("COMPLETED");
        assertThat(statusBasics.attemptCount()).isEqualTo(1);
        assertThat(statusBasics.completionCount()).isEqualTo(1);

        assertThat(historyCleanup.status().name()).isEqualTo("NOT_STARTED");
        assertThat(historyCleanup.attemptCount()).isZero();
        assertThat(historyCleanup.completionCount()).isZero();
        assertThat(historyCleanup.lastActivityAt()).isNull();

        assertThat(summary.recommendations().solved())
                .extracting(RecommendationScenario::scenarioSlug)
                .containsExactly("status-basics");
        assertThat(summary.recommendations().attempted())
                .extracting(RecommendationScenario::scenarioSlug)
                .containsExactly("branch-safety");
        assertThat(summary.recommendations().next().scenarioSlug()).isEqualTo("branch-safety");
        assertThat(summary.recommendations().rationale())
                .isEqualTo("Continue the scenario that already has unresolved progress.");
    }

    @Test
    void sortsRecentActivityFromLatestRecordedProgress() {
        String firstSessionId = startSessionUseCase.start(new StartSessionCommand("status-basics", null))
                .session()
                .sessionId();
        String secondSessionId = startSessionUseCase.start(new StartSessionCommand("history-cleanup-preview", null))
                .session()
                .sessionId();

        submitAnswerUseCase.submit(
                firstSessionId,
                new SubmitAnswerCommand("command_text", "git status")
        );
        submitAnswerUseCase.submit(
                secondSessionId,
                new SubmitAnswerCommand("command_text", "git log --oneline --decorate")
        );

        ProgressSummary summary = loadProgressSummaryUseCase.load();

        assertThat(summary.recentActivity()).isNotEmpty();
        assertThat(summary.recentActivity().getFirst().happenedAt())
                .isAfterOrEqualTo(summary.recentActivity().get(1).happenedAt());
        assertThat(summary.recentActivity())
                .extracting(RecentProgressActivity::scenarioSlug)
                .contains("status-basics", "history-cleanup-preview");
    }

    @Test
    void recommendsFirstUntouchedScenarioWhenNoProgressIsRecordedYet() {
        ProgressSummary summary = loadProgressSummaryUseCase.load();

        assertThat(summary.recommendations().solved()).isEmpty();
        assertThat(summary.recommendations().attempted()).isEmpty();
        assertThat(summary.recommendations().next().scenarioSlug()).isEqualTo("branch-safety");
        assertThat(summary.recommendations().rationale())
                .isEqualTo("Start the next untouched scenario from the current catalog order.");
    }

    private ProgressSummaryItem findItem(ProgressSummary summary, String scenarioSlug) {
        return summary.items().stream()
                .filter(item -> scenarioSlug.equals(item.scenarioSlug()))
                .findFirst()
                .orElseThrow();
    }
}

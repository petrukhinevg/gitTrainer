package com.example.gittrainer.progress.application;

import com.example.gittrainer.progress.domain.ScenarioCompletionEvent;
import com.example.gittrainer.progress.domain.ScenarioProgressRecord;
import com.example.gittrainer.session.application.StartSessionCommand;
import com.example.gittrainer.session.application.StartSessionResult;
import com.example.gittrainer.session.application.StartSessionUseCase;
import com.example.gittrainer.session.application.SubmitAnswerCommand;
import com.example.gittrainer.session.application.SubmitAnswerResult;
import com.example.gittrainer.session.application.SubmitAnswerUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class SubmitAnswerProgressRecordingTest {

    @Autowired
    private StartSessionUseCase startSessionUseCase;

    @Autowired
    private SubmitAnswerUseCase submitAnswerUseCase;

    @Autowired
    private ProgressRepository progressRepository;

    @Test
    void recordsAttemptOutcomesAndCompletionEventsFromEvaluatedSubmissions() {
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

        ScenarioProgressRecord progressRecord = progressRepository.findByScenarioSlug("status-basics").orElseThrow();
        List<ScenarioCompletionEvent> completionEvents = progressRepository.findCompletionEvents().stream()
                .filter(event -> sessionId.equals(event.sessionId()))
                .toList();

        assertThat(progressRecord.attemptCount()).isEqualTo(2);
        assertThat(progressRecord.completionCount()).isEqualTo(1);
        assertThat(progressRecord.lastSessionId()).isEqualTo(sessionId);
        assertThat(progressRecord.lastSubmissionId()).isEqualTo(correctAttempt.submissionId());
        assertThat(progressRecord.lastCorrectness()).isEqualTo("correct");
        assertThat(progressRecord.lastSubmittedAt()).isEqualTo(correctAttempt.submittedAt());
        assertThat(progressRecord.lastCompletedAt()).isEqualTo(correctAttempt.submittedAt());

        assertThat(completionEvents).hasSize(1);
        assertThat(completionEvents.getFirst().scenarioSlug()).isEqualTo("status-basics");
        assertThat(completionEvents.getFirst().sessionId()).isEqualTo(sessionId);
        assertThat(completionEvents.getFirst().submissionId()).isEqualTo(correctAttempt.submissionId());
        assertThat(completionEvents.getFirst().completedAt()).isEqualTo(correctAttempt.submittedAt());
        assertThat(incorrectAttempt.outcome().correctness()).isEqualTo("incorrect");
    }
}

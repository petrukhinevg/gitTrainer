package com.example.gittrainer.progress.application;

import com.example.gittrainer.progress.domain.ScenarioProgressRecord;
import com.example.gittrainer.session.application.StartSessionCommand;
import com.example.gittrainer.session.application.StartSessionResult;
import com.example.gittrainer.session.application.StartSessionUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class StartSessionProgressRecordingTest {

    @Autowired
    private StartSessionUseCase startSessionUseCase;

    @Autowired
    private ProgressRepository progressRepository;

    @Test
    void recordsInProgressScenarioWhenSessionStarts() {
        StartSessionResult startedSession = startSessionUseCase.start(new StartSessionCommand("status-basics", null));

        ScenarioProgressRecord progressRecord = progressRepository.findByScenarioSlug("status-basics").orElseThrow();

        assertThat(progressRecord.scenarioSlug()).isEqualTo("status-basics");
        assertThat(progressRecord.scenarioTitle()).isEqualTo(startedSession.session().scenarioTitle());
        assertThat(progressRecord.scenarioSource()).isEqualTo(startedSession.session().scenarioSource());
        assertThat(progressRecord.firstStartedAt()).isEqualTo(startedSession.session().startedAt());
        assertThat(progressRecord.lastStartedAt()).isEqualTo(startedSession.session().startedAt());
        assertThat(progressRecord.lastSessionId()).isEqualTo(startedSession.session().sessionId());
        assertThat(progressRecord.attemptCount()).isZero();
        assertThat(progressRecord.completionCount()).isZero();
        assertThat(progressRecord.lastSubmittedAt()).isNull();
        assertThat(progressRecord.lastSubmissionId()).isNull();
        assertThat(progressRecord.lastCorrectness()).isNull();
        assertThat(progressRecord.lastCompletedAt()).isNull();
    }
}

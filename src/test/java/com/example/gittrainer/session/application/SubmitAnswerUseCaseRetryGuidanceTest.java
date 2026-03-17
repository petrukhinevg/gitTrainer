package com.example.gittrainer.session.application;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class SubmitAnswerUseCaseRetryGuidanceTest {

    @Autowired
    private StartSessionUseCase startSessionUseCase;

    @Autowired
    private SubmitAnswerUseCase submitAnswerUseCase;

    @Test
    void returnsScenarioSpecificGuidanceForIncorrectSubmission() {
        StartSessionResult startedSession = startSessionUseCase.start(new StartSessionCommand("status-basics", null));

        SubmitAnswerResult result = submitAnswerUseCase.submit(
                startedSession.session().sessionId(),
                new SubmitAnswerCommand("command_text", "git checkout main")
        );

        assertThat(result.retryGuidance().explanation().code())
                .isEqualTo("inspection-command-should-come-before-mutation");
        assertThat(result.retryGuidance().hint().level()).isEqualTo("nudge");
    }

    @Test
    void escalatesGuidanceForSecondFailure() {
        StartSessionResult startedSession = startSessionUseCase.start(new StartSessionCommand("branch-safety", null));
        String sessionId = startedSession.session().sessionId();

        submitAnswerUseCase.submit(
                sessionId,
                new SubmitAnswerCommand("command_text", "git status")
        );

        SubmitAnswerResult secondResult = submitAnswerUseCase.submit(
                sessionId,
                new SubmitAnswerCommand("command_text", "git status")
        );

        assertThat(secondResult.retryGuidance().explanation().code())
                .isEqualTo("branch-choice-needs-task-alignment");
        assertThat(secondResult.retryGuidance().hint().level()).isEqualTo("strong");
        assertThat(secondResult.retryGuidance().hint().code()).isEqualTo("branch-intent-strong");
    }

    @Test
    void returnsUnsupportedGuidanceForUnsupportedAnswerType() {
        StartSessionResult startedSession = startSessionUseCase.start(new StartSessionCommand("history-cleanup-preview", null));

        SubmitAnswerResult result = submitAnswerUseCase.submit(
                startedSession.session().sessionId(),
                new SubmitAnswerCommand("file_patch", "git status")
        );

        assertThat(result.retryGuidance().explanation().code()).isEqualTo("unsupported-answer-type");
        assertThat(result.retryGuidance().hint().code()).isEqualTo("unsupported-answer-type-nudge");
    }
}

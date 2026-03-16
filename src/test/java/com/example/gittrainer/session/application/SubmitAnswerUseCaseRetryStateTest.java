package com.example.gittrainer.session.application;

import com.example.gittrainer.session.domain.RetryStatePhase;
import com.example.gittrainer.session.domain.StrongerHintEligibility;
import com.example.gittrainer.session.domain.TrainingSession;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class SubmitAnswerUseCaseRetryStateTest {

    @Autowired
    private StartSessionUseCase startSessionUseCase;

    @Autowired
    private SubmitAnswerUseCase submitAnswerUseCase;

    @Autowired
    private SessionRepository sessionRepository;

    @Test
    void tracksConsecutiveFailuresAndUnlocksStrongerHintOnSecondFailure() {
        StartSessionResult startedSession = startSessionUseCase.start(new StartSessionCommand("status-basics", null));
        String sessionId = startedSession.session().sessionId();

        SubmitAnswerResult firstFailure = submitAnswerUseCase.submit(
                sessionId,
                new SubmitAnswerCommand("command_text", "git checkout main")
        );
        SubmitAnswerResult secondFailure = submitAnswerUseCase.submit(
                sessionId,
                new SubmitAnswerCommand("file_patch", "git status")
        );

        assertThat(firstFailure.retryState().phase()).isEqualTo(RetryStatePhase.RETRY_AVAILABLE);
        assertThat(firstFailure.retryState().attemptCount()).isEqualTo(1);
        assertThat(firstFailure.retryState().consecutiveFailureCount()).isEqualTo(1);
        assertThat(firstFailure.retryState().strongerHintEligibility()).isEqualTo(StrongerHintEligibility.LOCKED);

        assertThat(secondFailure.retryState().phase()).isEqualTo(RetryStatePhase.RETRY_AVAILABLE);
        assertThat(secondFailure.retryState().attemptCount()).isEqualTo(2);
        assertThat(secondFailure.retryState().consecutiveFailureCount()).isEqualTo(2);
        assertThat(secondFailure.retryState().strongerHintEligibility()).isEqualTo(StrongerHintEligibility.ELIGIBLE);

        TrainingSession persistedSession = sessionRepository.findById(sessionId).orElseThrow();
        assertThat(persistedSession.consecutiveFailureCount()).isEqualTo(2);
    }

    @Test
    void clearsFailureStreakAfterCorrectSubmission() {
        StartSessionResult startedSession = startSessionUseCase.start(new StartSessionCommand("status-basics", null));
        String sessionId = startedSession.session().sessionId();

        submitAnswerUseCase.submit(
                sessionId,
                new SubmitAnswerCommand("command_text", "git checkout main")
        );

        SubmitAnswerResult success = submitAnswerUseCase.submit(
                sessionId,
                new SubmitAnswerCommand("command_text", "git status")
        );

        assertThat(success.retryState().phase()).isEqualTo(RetryStatePhase.COMPLETED);
        assertThat(success.retryState().attemptCount()).isEqualTo(2);
        assertThat(success.retryState().consecutiveFailureCount()).isZero();
        assertThat(success.retryState().strongerHintEligibility()).isEqualTo(StrongerHintEligibility.NOT_NEEDED);

        TrainingSession persistedSession = sessionRepository.findById(sessionId).orElseThrow();
        assertThat(persistedSession.consecutiveFailureCount()).isZero();
    }
}

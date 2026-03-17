package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.SubmitAnswerResult;
import com.example.gittrainer.session.domain.RetryGuidance;
import com.example.gittrainer.session.domain.RetryGuidancePolicy;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.session.domain.StrongerHintEligibility;
import com.example.gittrainer.session.domain.SubmittedAnswer;
import com.example.gittrainer.session.domain.SessionState;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class SessionResponseMapperTest {

    private final SessionResponseMapper mapper = new SessionResponseMapper();

    @Test
    void mapsPartialRetryGuidanceIntoStableGuidedPayload() {
        RetryState retryState = RetryState.retryAvailable(2, 2, StrongerHintEligibility.ELIGIBLE);
        SubmissionOutcome outcome = new SubmissionOutcome(
                "evaluated",
                "partial",
                "partial-command-match",
                "Отправленная команда указывает в правильную область проверки, но её ещё нужно уточнить."
        );
        RetryGuidance retryGuidance = RetryGuidancePolicy.selectGuidance("status-basics", outcome, retryState);

        SessionSubmissionResponse response = mapper.toSubmissionResponse(new SubmitAnswerResult(
                "submission_2",
                2,
                Instant.parse("2026-03-17T00:00:00Z"),
                new TrainingSession(
                        "session_1",
                        "status-basics",
                        "Сначала проверь рабочее дерево",
                        "mvp-fixture",
                        Instant.parse("2026-03-17T00:00:00Z"),
                        SessionState.ACTIVE,
                        2,
                        2,
                        "submission_2"
                ),
                new SubmittedAnswer("command_text", "git branch"),
                outcome,
                retryState,
                retryGuidance
        ));

        assertThat(response.retryFeedback().status()).isEqualTo("guided");
        assertThat(response.retryFeedback().retryState().status()).isEqualTo("retry-available");
        assertThat(response.retryFeedback().retryState().eligibility()).isEqualTo("eligible");
        assertThat(response.retryFeedback().explanation().status()).isEqualTo("guided");
        assertThat(response.retryFeedback().explanation().tone()).isEqualTo("partial");
        assertThat(response.retryFeedback().explanation().title())
                .isEqualTo("Вы смотрите в правильную область, но команду ещё нужно уточнить");
        assertThat(response.retryFeedback().explanation().message())
                .contains("git branch")
                .contains("более точная команда проверки");
        assertThat(response.retryFeedback().explanation().details()).hasSize(2);
        assertThat(response.retryFeedback().hint().status()).isEqualTo("guided");
        assertThat(response.retryFeedback().hint().level()).isEqualTo("strong");
        assertThat(response.retryFeedback().hint().reveals())
                .extracting(RetryHintRevealResponse::id)
                .containsExactly("nudge", "strong");
    }
}

package com.example.gittrainer.session.api;

import com.example.gittrainer.session.domain.RetryExplanationSelection;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RetryExplanationResponseFactoryTest {

    private final RetryExplanationResponseFactory factory = new RetryExplanationResponseFactory();

    @Test
    void formatsSubmittedAnswerInsidePartialGuidanceMessage() {
        RetryExplanationResponse response = factory.guidedResponse(
                RetryExplanationSelection.selected(
                        "partial-answer-needs-refinement",
                        "refine-incomplete-git-intent"
                ),
                "git branch"
        );

        assertThat(response.status()).isEqualTo("guided");
        assertThat(response.tone()).isEqualTo("partial");
        assertThat(response.message()).contains("git branch");
        assertThat(response.details()).hasSize(2);
    }

    @Test
    void fallsBackToScenarioGoalMessagingWhenSpecificCodeIsMissing() {
        RetryExplanationResponse response = factory.guidedResponse(
                RetryExplanationSelection.selected("missing-guidance-code", "unknown"),
                "git status"
        );

        assertThat(response.title()).isEqualTo("Вернитесь к цели сценария перед следующей попыткой");
        assertThat(response.tone()).isEqualTo("incorrect");
        assertThat(response.details()).hasSize(2);
    }
}

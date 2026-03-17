package com.example.gittrainer.session.domain;

import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RetryGuidancePolicyTest {

    @Test
    void selectsScenarioSpecificIncorrectGuidanceForStatusBasics() {
        RetryGuidance guidance = RetryGuidancePolicy.selectGuidance(
                "status-basics",
                SubmissionOutcome.incorrect("unexpected-command", "Wrong command."),
                RetryState.retryAvailable(1, 1, StrongerHintEligibility.LOCKED)
        );

        assertThat(guidance.explanation().status()).isEqualTo("selected");
        assertThat(guidance.explanation().code()).isEqualTo("inspection-command-should-come-before-mutation");
        assertThat(guidance.explanation().focus()).isEqualTo("inspect-working-tree-before-acting");
        assertThat(guidance.hint().level()).isEqualTo("nudge");
        assertThat(guidance.hint().code()).isEqualTo("working-tree-inspection-nudge");
    }

    @Test
    void escalatesHintStrengthAfterRepeatedFailure() {
        RetryGuidance guidance = RetryGuidancePolicy.selectGuidance(
                "branch-safety",
                SubmissionOutcome.incorrect("unexpected-command", "Wrong command."),
                RetryState.retryAvailable(2, 2, StrongerHintEligibility.ELIGIBLE)
        );

        assertThat(guidance.explanation().code()).isEqualTo("branch-choice-needs-task-alignment");
        assertThat(guidance.hint().level()).isEqualTo("strong");
        assertThat(guidance.hint().code()).isEqualTo("branch-intent-strong");
    }

    @Test
    void selectsUnsupportedAnswerGuidanceWithoutScenarioSpecificBranching() {
        RetryGuidance guidance = RetryGuidancePolicy.selectGuidance(
                "history-cleanup-preview",
                SubmissionOutcome.unsupported("unsupported-answer-type", "Unsupported."),
                RetryState.retryAvailable(1, 1, StrongerHintEligibility.LOCKED)
        );

        assertThat(guidance.explanation().code()).isEqualTo("unsupported-answer-type");
        assertThat(guidance.explanation().focus()).isEqualTo("return-to-supported-command-input");
        assertThat(guidance.hint().code()).isEqualTo("unsupported-answer-type-nudge");
    }

    @Test
    void supportsPartialAnswerCasesEvenBeforeValidatorProducesThem() {
        RetryGuidance guidance = RetryGuidancePolicy.selectGuidance(
                "status-basics",
                new SubmissionOutcome("evaluated", "partial", "partial-match", "Almost there."),
                RetryState.retryAvailable(2, 2, StrongerHintEligibility.ELIGIBLE)
        );

        assertThat(guidance.explanation().code()).isEqualTo("partial-answer-needs-refinement");
        assertThat(guidance.hint().level()).isEqualTo("strong");
        assertThat(guidance.hint().code()).isEqualTo("partial-answer-strong");
    }

    @Test
    void returnsNotNeededGuidanceAfterCorrectAnswer() {
        RetryGuidance guidance = RetryGuidancePolicy.selectGuidance(
                "status-basics",
                SubmissionOutcome.correct("expected-command", "Correct."),
                RetryState.completed(1)
        );

        assertThat(guidance).isEqualTo(RetryGuidance.notNeeded());
    }
}

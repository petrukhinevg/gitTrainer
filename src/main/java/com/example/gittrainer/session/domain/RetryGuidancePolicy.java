package com.example.gittrainer.session.domain;

import com.example.gittrainer.validation.domain.SubmissionOutcome;

public final class RetryGuidancePolicy {

    private RetryGuidancePolicy() {
    }

    public static RetryGuidance selectGuidance(
            RetryGuidanceProfile incorrectGuidance,
            SubmissionOutcome outcome,
            RetryState retryState
    ) {
        if (outcome == null || retryState == null || !outcome.requiresRetry()) {
            return RetryGuidance.notNeeded();
        }

        String normalizedCorrectness = outcome.correctness() == null ? "" : outcome.correctness().trim();
        return switch (normalizedCorrectness) {
            case "partial" -> partialGuidance(retryState);
            case "unsupported" -> unsupportedGuidance(retryState);
            default -> incorrectGuidance(incorrectGuidance, retryState);
        };
    }

    private static RetryGuidance partialGuidance(RetryState retryState) {
        return new RetryGuidance(
                RetryExplanationSelection.selected(
                        "partial-answer-needs-refinement",
                        "refine-incomplete-git-intent"
                ),
                RetryHintSelection.selected(
                        resolveHintLevel(retryState),
                        hintCode("partial-answer", retryState)
                )
        );
    }

    private static RetryGuidance unsupportedGuidance(RetryState retryState) {
        return new RetryGuidance(
                RetryExplanationSelection.selected(
                        "unsupported-answer-type",
                        "return-to-supported-command-input"
                ),
                RetryHintSelection.selected(
                        resolveHintLevel(retryState),
                        hintCode("unsupported-answer-type", retryState)
                )
        );
    }

    private static RetryGuidance incorrectGuidance(RetryGuidanceProfile profile, RetryState retryState) {
        RetryGuidanceProfile safeProfile = profile == null ? RetryGuidanceProfile.fallback() : profile;
        return new RetryGuidance(
                RetryExplanationSelection.selected(safeProfile.explanationCode(), safeProfile.focus()),
                RetryHintSelection.selected(
                        resolveHintLevel(retryState),
                        hintCode(safeProfile.hintTemplateCode(), retryState)
                )
        );
    }

    private static String resolveHintLevel(RetryState retryState) {
        return retryState.strongerHintEligibility() == StrongerHintEligibility.ELIGIBLE
                ? "strong"
                : "nudge";
    }

    private static String hintCode(String prefix, RetryState retryState) {
        String suffix = retryState.strongerHintEligibility() == StrongerHintEligibility.ELIGIBLE
                ? "strong"
                : "nudge";
        return prefix + "-" + suffix;
    }
}

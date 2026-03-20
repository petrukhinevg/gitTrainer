package com.example.gittrainer.session.domain;

import com.example.gittrainer.validation.domain.SubmissionOutcome;

public final class RetryGuidancePolicy {

    private RetryGuidancePolicy() {
    }

    public static RetryGuidance selectGuidance(String scenarioSlug, SubmissionOutcome outcome, RetryState retryState) {
        if (outcome == null || retryState == null || !outcome.requiresRetry()) {
            return RetryGuidance.notNeeded();
        }

        String normalizedCorrectness = outcome.correctness() == null ? "" : outcome.correctness().trim();
        return switch (normalizedCorrectness) {
            case "partial" -> partialGuidance(retryState);
            case "unsupported" -> unsupportedGuidance(retryState);
            default -> incorrectGuidance(scenarioSlug, retryState);
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

    private static RetryGuidance incorrectGuidance(String scenarioSlug, RetryState retryState) {
        ScenarioGuidanceProfile profile = scenarioProfile(scenarioSlug);
        return new RetryGuidance(
                RetryExplanationSelection.selected(profile.explanationCode(), profile.focus()),
                RetryHintSelection.selected(
                        resolveHintLevel(retryState),
                        hintCode(profile.hintPrefix(), retryState)
                )
        );
    }

    private static ScenarioGuidanceProfile scenarioProfile(String scenarioSlug) {
        return switch (scenarioSlug) {
            case "branch-safety" -> new ScenarioGuidanceProfile(
                    "branch-choice-needs-task-alignment",
                    "compare-branch-purpose-before-switching",
                    "branch-intent"
            );
            case "history-cleanup-preview" -> new ScenarioGuidanceProfile(
                    "history-cleanup-requires-plan-first",
                    "plan-history-cleanup-before-rewriting",
                    "history-plan"
            );
            case "remote-sync-preview" -> new ScenarioGuidanceProfile(
                    "remote-sync-requires-fetch-first",
                    "refresh-remote-state-before-integration",
                    "remote-fetch"
            );
            case "status-basics" -> new ScenarioGuidanceProfile(
                    "inspection-command-should-come-before-mutation",
                    "inspect-working-tree-before-acting",
                    "working-tree-inspection"
            );
            default -> new ScenarioGuidanceProfile(
                    "retry-guidance-needs-scenario-review",
                    "revisit-scenario-goal-before-next-attempt",
                    "generic-retry"
            );
        };
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

    private record ScenarioGuidanceProfile(
            String explanationCode,
            String focus,
            String hintPrefix
    ) {
    }
}

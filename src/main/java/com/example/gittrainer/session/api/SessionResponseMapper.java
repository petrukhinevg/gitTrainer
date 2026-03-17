package com.example.gittrainer.session.api;

import com.example.gittrainer.session.application.StartSessionResult;
import com.example.gittrainer.session.application.SubmitAnswerResult;
import com.example.gittrainer.session.domain.RetryExplanationSelection;
import com.example.gittrainer.session.domain.RetryGuidance;
import com.example.gittrainer.session.domain.RetryHintSelection;
import com.example.gittrainer.session.domain.RetryState;
import com.example.gittrainer.session.domain.TrainingSession;
import com.example.gittrainer.validation.domain.SubmissionOutcome;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.List;

@Component
public class SessionResponseMapper {

    public SessionStartResponse toStartResponse(StartSessionResult result) {
        return new SessionStartResponse(
                result.session().sessionId(),
                new SessionScenarioResponse(
                        result.session().scenarioSlug(),
                        result.session().scenarioTitle(),
                        result.session().scenarioSource()
                ),
                toLifecycleResponse(result.session()),
                new SessionSubmissionBoundaryResponse(
                        result.supportedAnswerTypes(),
                        toOutcomeResponse(result.placeholderOutcome()),
                        toRetryFeedbackResponse(
                                result.retryState(),
                                null,
                                result.placeholderOutcome(),
                                null
                        )
                )
        );
    }

    public SessionSubmissionResponse toSubmissionResponse(SubmitAnswerResult result) {
        return new SessionSubmissionResponse(
                result.submissionId(),
                result.session().sessionId(),
                result.attemptNumber(),
                result.submittedAt(),
                toLifecycleResponse(result.session()),
                new SubmittedAnswerResponse(result.answer().type(), result.answer().value()),
                toOutcomeResponse(result.outcome()),
                toRetryFeedbackResponse(
                        result.retryState(),
                        result.retryGuidance(),
                        result.outcome(),
                        result.answer().value()
                )
        );
    }

    private SessionLifecycleResponse toLifecycleResponse(TrainingSession session) {
        return new SessionLifecycleResponse(
                session.state().name().toLowerCase(Locale.ROOT),
                session.startedAt(),
                session.submissionCount(),
                session.lastSubmissionId()
        );
    }

    private SubmissionOutcomeResponse toOutcomeResponse(SubmissionOutcome outcome) {
        return new SubmissionOutcomeResponse(
                outcome.status(),
                outcome.correctness(),
                outcome.code(),
                outcome.message()
        );
    }

    private RetryFeedbackResponse toRetryFeedbackResponse(
            RetryState retryState,
            RetryGuidance retryGuidance,
            SubmissionOutcome outcome,
            String submittedAnswer
    ) {
        if (outcome == null || retryState == null || retryState.attemptCount() == 0 || "placeholder".equals(outcome.status())) {
            return placeholderRetryFeedback(retryState);
        }

        if (!outcome.requiresRetry()) {
            return resolvedRetryFeedback(retryState);
        }

        return guidedRetryFeedback(retryState, retryGuidance, submittedAnswer);
    }

    private RetryFeedbackResponse placeholderRetryFeedback(RetryState retryState) {
        RetryState safeRetryState = retryState == null ? RetryState.initial() : retryState;
        return new RetryFeedbackResponse(
                "placeholder",
                new RetryStateResponse(
                        toRetryStateStatus(safeRetryState),
                        safeRetryState.attemptCount(),
                        toRetryEligibility(safeRetryState)
                ),
                new RetryExplanationResponse(
                        "placeholder",
                        "Retry guidance",
                        "neutral",
                        "Retry guidance will mount here after the first evaluated submission.",
                        List.of()
                ),
                new RetryHintResponse(
                        "placeholder",
                        "baseline",
                        "Hint progression is idle until the learner receives evaluated feedback.",
                        List.of()
                )
        );
    }

    private RetryFeedbackResponse resolvedRetryFeedback(RetryState retryState) {
        return new RetryFeedbackResponse(
                "resolved",
                new RetryStateResponse(
                        toRetryStateStatus(retryState),
                        retryState.attemptCount(),
                        toRetryEligibility(retryState)
                ),
                new RetryExplanationResponse(
                        "resolved",
                        "No retry explanation needed",
                        "success",
                        "This attempt already landed on the safe next action, so the retry panel stays quiet.",
                        List.of()
                ),
                new RetryHintResponse(
                        "resolved",
                        "none",
                        "No extra hint is needed after a correct answer.",
                        List.of()
                )
        );
    }

    private RetryFeedbackResponse guidedRetryFeedback(
            RetryState retryState,
            RetryGuidance retryGuidance,
            String submittedAnswer
    ) {
        RetryGuidance safeGuidance = retryGuidance == null ? RetryGuidance.notNeeded() : retryGuidance;

        return new RetryFeedbackResponse(
                "guided",
                new RetryStateResponse(
                        toRetryStateStatus(retryState),
                        retryState.attemptCount(),
                        toRetryEligibility(retryState)
                ),
                toGuidedExplanationResponse(safeGuidance.explanation(), submittedAnswer),
                toGuidedHintResponse(safeGuidance.hint())
        );
    }

    private RetryExplanationResponse toGuidedExplanationResponse(
            RetryExplanationSelection explanationSelection,
            String submittedAnswer
    ) {
        RetryExplanationNarrative narrative = explanationNarrative(explanationSelection, submittedAnswer);
        return new RetryExplanationResponse(
                "guided",
                narrative.title(),
                narrative.tone(),
                narrative.message(),
                narrative.details()
        );
    }

    private RetryHintResponse toGuidedHintResponse(RetryHintSelection hintSelection) {
        RetryHintNarrative narrative = hintNarrative(hintSelection);
        return new RetryHintResponse(
                "guided",
                narrative.level(),
                narrative.message(),
                narrative.reveals()
        );
    }

    private RetryExplanationNarrative explanationNarrative(
            RetryExplanationSelection explanationSelection,
            String submittedAnswer
    ) {
        String normalizedAnswer = normalizeSubmittedAnswer(submittedAnswer);
        String code = explanationSelection == null ? "" : explanationSelection.code();

        return switch (code) {
            case "partial-answer-needs-refinement" -> new RetryExplanationNarrative(
                    "You are inspecting the right area, but the command still needs tightening",
                    "partial",
                    "`%s` points toward the right repository signal, but the task still needs a more precise inspection command before the answer is considered correct."
                            .formatted(normalizedAnswer),
                    List.of(
                            "The learner has started from the correct inspection family, so the retry message should reward that direction instead of treating it as a total miss.",
                            "The follow-up hint can narrow the command shape without redesigning the feedback panel."
                    )
            );
            case "unsupported-answer-type" -> new RetryExplanationNarrative(
                    "Return to supported command input",
                    "unsupported",
                    "This MVP slice still evaluates only command-style answers, so the next attempt should switch back to a supported command entry.",
                    List.of(
                            "The current transport accepts the request, but the correctness model still marks the answer type as unsupported.",
                            "Keep the retry panel focused on getting back to a supported command flow before exploring richer answer formats."
                    )
            );
            case "branch-choice-needs-task-alignment" -> new RetryExplanationNarrative(
                    "Check which branch actually matches the task",
                    "incorrect",
                    "The next retry should compare the task goal with each branch's purpose before switching, so the answer stays aligned with the scenario instead of making an arbitrary branch move.",
                    List.of(
                            "This scenario is not asking for a generic branch command. It wants the learner to choose the branch that serves the task safely.",
                            "The retry explanation should keep attention on branch intent first, then narrow toward the exact command."
                    )
            );
            case "history-cleanup-requires-plan-first" -> new RetryExplanationNarrative(
                    "Plan the history cleanup before changing commits",
                    "incorrect",
                    "The scenario expects a preview or planning step before any history rewrite, so the next retry should confirm the cleanup strategy before touching commits.",
                    List.of(
                            "History-editing commands are powerful, so the learning loop should reinforce inspection before rewrite.",
                            "A stronger hint can safely narrow the learner toward the exact preview command once the retry policy unlocks it."
                    )
            );
            case "inspection-command-should-come-before-mutation" -> new RetryExplanationNarrative(
                    "Inspect the working tree before changing it",
                    "incorrect",
                    "The safe next action in this scenario is to inspect repository state first, rather than jumping straight to a mutating command.",
                    List.of(
                            "This exercise is about reading the current state before acting, not about choosing a destination branch or altering files.",
                            "The retry panel should keep the learner in the inspection loop until the correct command shape is clear."
                    )
            );
            default -> new RetryExplanationNarrative(
                    "Revisit the scenario goal before the next attempt",
                    "incorrect",
                    "The retry loop should return to the scenario goal, then narrow the next attempt with the smallest safe hint available.",
                    List.of(
                            "When scenario-specific guidance is unavailable, keep the explanation focused on the task goal instead of inventing new rules.",
                            "The next hint can still tighten the retry path without redesigning the policy layer."
                    )
            );
        };
    }

    private RetryHintNarrative hintNarrative(RetryHintSelection hintSelection) {
        if (hintSelection == null || !"selected".equals(hintSelection.status())) {
            return new RetryHintNarrative("baseline", "Hint guidance is unavailable.", List.of());
        }

        HintCopy hintCopy = hintCopy(hintSelection.code());
        boolean strongerHintUnlocked = "strong".equals(hintSelection.level());
        List<RetryHintRevealResponse> reveals = strongerHintUnlocked
                ? List.of(
                new RetryHintRevealResponse("nudge", "Reveal first hint", hintCopy.nudgeTitle(), hintCopy.nudgeMessage()),
                new RetryHintRevealResponse("strong", "Reveal stronger hint", hintCopy.strongTitle(), hintCopy.strongMessage())
        )
                : List.of(
                new RetryHintRevealResponse("nudge", "Reveal first hint", hintCopy.nudgeTitle(), hintCopy.nudgeMessage())
        );

        return new RetryHintNarrative(
                hintSelection.level(),
                strongerHintUnlocked
                        ? "A stronger hint is now available because the learner has already missed at least one attempt."
                        : "Start with a lighter nudge before revealing the stronger guidance.",
                reveals
        );
    }

    private HintCopy hintCopy(String hintCode) {
        String code = hintCode == null ? "" : hintCode;

        return switch (code) {
            case "partial-answer-nudge", "partial-answer-strong" -> new HintCopy(
                    "Keep the same inspection family",
                    "Stay in the same inspection area, but remove extra scope or switch to the canonical safe command for the scenario.",
                    "Compare against the exact safe next action",
                    "Look for the smallest command that inspects the repository state the task is asking about, without adding extra intent."
            );
            case "unsupported-answer-type-nudge", "unsupported-answer-type-strong" -> new HintCopy(
                    "Use the command text mode",
                    "Switch the answer type back to command text and keep the next attempt in a simple inspection command shape.",
                    "Mirror the supported answer examples",
                    "Look at the supported answer type badge above the composer and mirror that mode before changing the command itself."
            );
            case "branch-intent-nudge", "branch-intent-strong" -> new HintCopy(
                    "Name the branch goal first",
                    "Before choosing a branch command, ask which branch actually matches the task's purpose.",
                    "Prefer the branch move that changes the least state",
                    "Pick the command that only moves the learner to the branch that already fits the goal, instead of mixing inspection with extra history changes."
            );
            case "history-plan-nudge", "history-plan-strong" -> new HintCopy(
                    "Preview the history before editing it",
                    "Stay in inspection mode and confirm which commits are about to be cleaned up before rewriting anything.",
                    "Use the exact history preview command",
                    "Choose the smallest log-style command that shows the commit range you need to reason about before cleanup."
            );
            case "working-tree-inspection-nudge", "working-tree-inspection-strong" -> new HintCopy(
                    "Start with a working tree inspection",
                    "The scenario is asking for repository state, so keep the next attempt in the inspection family rather than mutating files or branches.",
                    "Use the canonical working tree check",
                    "Reach for the standard Git command that reports the current working tree and staging status before any other action."
            );
            default -> new HintCopy(
                    "Return to the scenario goal",
                    "Restate the task in one sentence and keep the next attempt focused on the smallest safe command that answers it.",
                    "Reveal the smallest safe next action",
                    "Strip away extra intent and choose the command that gives the learner the missing signal before any bigger move."
            );
        };
    }

    private String normalizeSubmittedAnswer(String submittedAnswer) {
        if (submittedAnswer == null || submittedAnswer.isBlank()) {
            return "the submitted command";
        }
        return submittedAnswer.trim().replaceAll("\\s+", " ");
    }

    private String toRetryStateStatus(RetryState retryState) {
        return switch (retryState.phase()) {
            case READY -> "idle";
            case RETRY_AVAILABLE -> "retry-available";
            case COMPLETED -> "complete";
        };
    }

    private String toRetryEligibility(RetryState retryState) {
        return switch (retryState.retryEligibility()) {
            case NOT_NEEDED -> "not-needed";
            case ELIGIBLE -> "eligible";
        };
    }

    private record RetryExplanationNarrative(
            String title,
            String tone,
            String message,
            List<String> details
    ) {
    }

    private record RetryHintNarrative(
            String level,
            String message,
            List<RetryHintRevealResponse> reveals
    ) {
    }

    private record HintCopy(
            String nudgeTitle,
            String nudgeMessage,
            String strongTitle,
            String strongMessage
    ) {
    }
}

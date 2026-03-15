package com.example.gittrainer.scenario.infrastructure;

import com.example.gittrainer.scenario.application.ScenarioTaskContentNotAuthoredException;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ScenarioTaskContentFixtureSource {

    private static final Map<String, ScenarioTaskContentFixture> FIXTURES = Map.of(
            "status-basics", new ScenarioTaskContentFixture(
                    "authored-fixture",
                    "Read the repository state before choosing the first safe Git command.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "read-short-status", "Read the short status output and note which files are modified versus untracked."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "check-branch", "Confirm which branch is currently checked out before deciding whether any branch change is needed."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "protect-worktree", "Avoid commands that mutate history or discard work while the tree is still being inspected.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "List the working tree signals", "Capture which paths are modified, untracked, or already staged so the next command is justified by evidence."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Identify the current branch", "Read the current branch first so the learner stays oriented before proposing any command."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "Choose the safest first command", "Select the first Git command that gathers information without changing repository history.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(2, "Safety cue", "Inspection comes before mutation in this scenario."),
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Target outcome", "The learner should justify a safe first command rather than execute cleanup immediately.")
                    )
            ),
            "branch-safety", new ScenarioTaskContentFixture(
                    "authored-fixture",
                    "Decide whether the task should continue on the current branch or after switching.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "read-current-branch", "Inspect the current branch before editing any files or staging any work."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "compare-task-intent", "Compare branch purpose with the requested task so the learner can justify staying or switching."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "avoid-implicit-switch", "Do not assume a branch switch is correct until the repository state and task goal agree.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "Match branch to task", "Relate the current branch name to the task description before proposing a checkout."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Inspect where you are", "Start by identifying the active branch and any signals that the working tree is already in use."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "State the branch decision", "Summarize whether to stay on the branch or switch, and why that choice is safer.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Decision boundary", "Branch navigation should be intentional and explained, not automatic.")
                    )
            ),
            "history-cleanup-preview", new ScenarioTaskContentFixture(
                    "authored-fixture",
                    "Prepare an ordered cleanup plan without rewriting history yet.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "inspect-commit-stack", "Read the recent commit stack and identify repeated or messy changes."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "plan-before-rewrite", "Describe the cleanup sequence before choosing any history-rewriting command."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "keep-remote-risk-visible", "Account for whether rewritten commits may already be shared with others.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "Group the cleanup targets", "Separate fixup candidates, reorder candidates, and commits that should remain untouched."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Read the stack top to bottom", "Inspect the current history in order before proposing a cleanup plan."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "Name the next safe action", "Choose the planning or inspection command that should come before any rewrite.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Planning mode", "This task stops at plan quality; it does not execute the rewrite.")
                    )
            ),
            "remote-sync-preview", new ScenarioTaskContentFixture(
                    "authored-fixture",
                    "Explain the next sync-oriented command after reading ahead-behind cues.",
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(1, "check-tracking", "Inspect how the local branch relates to its tracked remote branch."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(3, "separate-fetch-from-merge", "Keep fetch and merge decisions distinct until the repository state is understood."),
                            new ScenarioTaskContentFixture.ScenarioTaskInstructionFixture(2, "read-divergence", "Determine whether the branch is ahead, behind, or diverged before choosing a sync command.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(3, "Choose the sync command", "Name the safest next command based on whether new remote information is needed first."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(1, "Inspect tracking relationship", "Read the tracked remote branch before proposing pull or fetch."),
                            new ScenarioTaskContentFixture.ScenarioTaskStepFixture(2, "Interpret ahead-behind state", "Use the ahead-behind cues to justify whether integration should happen now or later.")
                    ),
                    java.util.List.of(
                            new ScenarioTaskContentFixture.ScenarioTaskAnnotationFixture(1, "Remote discipline", "Fetching information and integrating changes are separate decisions in this exercise.")
                    )
            )
    );

    public ScenarioTaskContentFixture fixtureFor(String scenarioSlug) {
        ScenarioTaskContentFixture fixture = FIXTURES.get(scenarioSlug);
        if (fixture == null) {
            throw new ScenarioTaskContentNotAuthoredException(scenarioSlug);
        }

        return fixture;
    }
}

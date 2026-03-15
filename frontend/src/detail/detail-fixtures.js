export const FIXTURE_SCENARIO_DETAILS = Object.freeze({
    "status-basics": {
        id: "status-basics",
        slug: "status-basics",
        title: "Read the working tree before acting",
        summary: "Inspect a noisy repository and identify the next safe Git command before making changes.",
        difficulty: "beginner",
        tags: ["status", "working-tree", "basics"],
        meta: {
            source: "local-fixture",
            stub: false
        },
        workspace: {
            shell: {
                leftPanelTitle: "Scenario map",
                centerPanelTitle: "Workspace lesson",
                rightPanelTitle: "Workspace lane"
            },
            task: {
                status: "authored-fixture",
                goal: "Read the repository state before choosing the first safe Git command.",
                instructions: [
                    {
                        id: "check-branch",
                        text: "Confirm which branch is currently checked out before deciding whether any branch change is needed."
                    },
                    {
                        id: "read-short-status",
                        text: "Read the short status output and note which files are modified versus untracked."
                    },
                    {
                        id: "protect-worktree",
                        text: "Avoid commands that mutate history or discard work while the tree is still being inspected."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Identify the current branch",
                        detail: "Read the current branch first so the learner stays oriented before proposing any command."
                    },
                    {
                        position: 2,
                        title: "List the working tree signals",
                        detail: "Capture which paths are modified, untracked, or already staged so the next command is justified by evidence."
                    },
                    {
                        position: 3,
                        title: "Choose the safest first command",
                        detail: "Select the first Git command that gathers information without changing repository history."
                    }
                ],
                annotations: [
                    {
                        label: "Target outcome",
                        message: "The learner should justify a safe first command rather than execute cleanup immediately."
                    },
                    {
                        label: "Safety cue",
                        message: "Inspection comes before mutation in this scenario."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "main", current: true },
                    { name: "docs/review-notes", current: false }
                ],
                commits: [
                    { id: "a1c9e31", summary: "docs: add review notes draft" },
                    { id: "f72ab44", summary: "app: keep workspace shell stable" }
                ],
                files: [
                    { path: "README.md", status: "modified" },
                    { path: "notes/status-checklist.md", status: "untracked" },
                    { path: "src/main.js", status: "modified" }
                ],
                annotations: [
                    { label: "Working tree cue", message: "Two tracked files changed and one checklist file is still untracked." },
                    { label: "Decision cue", message: "This scenario rewards an inspection command before any staging or cleanup." }
                ]
            }
        }
    },
    "branch-safety": {
        id: "branch-safety",
        slug: "branch-safety",
        title: "Choose the right branch before editing",
        summary: "Spot the active branch, compare task intent, and decide whether to stay put or switch first.",
        difficulty: "beginner",
        tags: ["branching", "navigation", "basics"],
        meta: {
            source: "local-fixture",
            stub: false
        },
        workspace: {
            shell: {
                leftPanelTitle: "Scenario map",
                centerPanelTitle: "Workspace lesson",
                rightPanelTitle: "Workspace lane"
            },
            task: {
                status: "authored-fixture",
                goal: "Decide whether the task should continue on the current branch or after switching.",
                instructions: [
                    {
                        id: "read-current-branch",
                        text: "Inspect the current branch before editing any files or staging any work."
                    },
                    {
                        id: "compare-task-intent",
                        text: "Compare branch purpose with the requested task so the learner can justify staying or switching."
                    },
                    {
                        id: "avoid-implicit-switch",
                        text: "Do not assume a branch switch is correct until the repository state and task goal agree."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Inspect where you are",
                        detail: "Start by identifying the active branch and any signals that the working tree is already in use."
                    },
                    {
                        position: 2,
                        title: "Match branch to task",
                        detail: "Relate the current branch name to the task description before proposing a checkout."
                    },
                    {
                        position: 3,
                        title: "State the branch decision",
                        detail: "Summarize whether to stay on the branch or switch, and why that choice is safer."
                    }
                ],
                annotations: [
                    {
                        label: "Decision boundary",
                        message: "Branch navigation should be intentional and explained, not automatic."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "release/hotfix-7", current: true },
                    { name: "feature/menu-refresh", current: false },
                    { name: "main", current: false }
                ],
                commits: [
                    { id: "b74e2d0", summary: "hotfix: restore header spacing" },
                    { id: "197a0f4", summary: "release: tag rollout checklist" }
                ],
                files: [
                    { path: "src/ui/header.css", status: "modified" },
                    { path: "docs/release-checklist.md", status: "modified" }
                ],
                annotations: [
                    { label: "Branch purpose", message: "The current branch is a hotfix branch with release-oriented changes already in progress." },
                    { label: "Task tension", message: "The learner must decide whether the requested work belongs here or on the feature branch." }
                ]
            }
        }
    },
    "history-cleanup-preview": {
        id: "history-cleanup-preview",
        slug: "history-cleanup-preview",
        title: "Preview a history cleanup plan",
        summary: "Read a messy commit stack and prepare for a later cleanup exercise without changing history yet.",
        difficulty: "intermediate",
        tags: ["history", "cleanup", "planning"],
        meta: {
            source: "local-fixture",
            stub: false
        },
        workspace: {
            shell: {
                leftPanelTitle: "Scenario map",
                centerPanelTitle: "Workspace lesson",
                rightPanelTitle: "Workspace lane"
            },
            task: {
                status: "authored-fixture",
                goal: "Prepare an ordered cleanup plan without rewriting history yet.",
                instructions: [
                    {
                        id: "inspect-commit-stack",
                        text: "Read the recent commit stack and identify repeated or messy changes."
                    },
                    {
                        id: "plan-before-rewrite",
                        text: "Describe the cleanup sequence before choosing any history-rewriting command."
                    },
                    {
                        id: "keep-remote-risk-visible",
                        text: "Account for whether rewritten commits may already be shared with others."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Read the stack top to bottom",
                        detail: "Inspect the current history in order before proposing a cleanup plan."
                    },
                    {
                        position: 2,
                        title: "Group the cleanup targets",
                        detail: "Separate fixup candidates, reorder candidates, and commits that should remain untouched."
                    },
                    {
                        position: 3,
                        title: "Name the next safe action",
                        detail: "Choose the planning or inspection command that should come before any rewrite."
                    }
                ],
                annotations: [
                    {
                        label: "Planning mode",
                        message: "This task stops at plan quality; it does not execute the rewrite."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "feature/history-cleanup", current: true },
                    { name: "main", current: false }
                ],
                commits: [
                    { id: "c102d6b", summary: "fixup! ui: rename shell badge" },
                    { id: "91fe2ad", summary: "ui: rename shell badge" },
                    { id: "43bc8c1", summary: "wip: tweak spacing again" }
                ],
                files: [
                    { path: "frontend/src/styles.css", status: "modified" },
                    { path: "frontend/src/workspace-shell/view.js", status: "modified" }
                ],
                annotations: [
                    { label: "History cue", message: "Recent commits include a fixup commit and an extra WIP change that suggest later cleanup." },
                    { label: "Safety cue", message: "The learner is still planning and should not rewrite history yet." }
                ]
            }
        }
    },
    "remote-sync-preview": {
        id: "remote-sync-preview",
        slug: "remote-sync-preview",
        title: "Read remote tracking state before you pull",
        summary: "Compare ahead-behind cues and choose whether a fetch or pull makes sense before syncing.",
        difficulty: "intermediate",
        tags: ["remote", "inspection", "planning"],
        meta: {
            source: "local-fixture",
            stub: false
        },
        workspace: {
            shell: {
                leftPanelTitle: "Scenario map",
                centerPanelTitle: "Workspace lesson",
                rightPanelTitle: "Workspace lane"
            },
            task: {
                status: "authored-fixture",
                goal: "Explain the next sync-oriented command after reading ahead-behind cues.",
                instructions: [
                    {
                        id: "check-tracking",
                        text: "Inspect how the local branch relates to its tracked remote branch."
                    },
                    {
                        id: "read-divergence",
                        text: "Determine whether the branch is ahead, behind, or diverged before choosing a sync command."
                    },
                    {
                        id: "separate-fetch-from-merge",
                        text: "Keep fetch and merge decisions distinct until the repository state is understood."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Inspect tracking relationship",
                        detail: "Read the tracked remote branch before proposing pull or fetch."
                    },
                    {
                        position: 2,
                        title: "Interpret ahead-behind state",
                        detail: "Use the ahead-behind cues to justify whether integration should happen now or later."
                    },
                    {
                        position: 3,
                        title: "Choose the sync command",
                        detail: "Name the safest next command based on whether new remote information is needed first."
                    }
                ],
                annotations: [
                    {
                        label: "Remote discipline",
                        message: "Fetching information and integrating changes are separate decisions in this exercise."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "main", current: true },
                    { name: "origin/main", current: false }
                ],
                commits: [
                    { id: "87d20aa", summary: "docs: clarify sync checklist" },
                    { id: "3fd81e5", summary: "feat: prepare remote status banner" }
                ],
                files: [
                    { path: "docs/sync-playbook.md", status: "clean" },
                    { path: "frontend/src/banner.js", status: "clean" }
                ],
                annotations: [
                    { label: "Remote cue", message: "Local main is one commit ahead while origin/main has unseen remote changes." },
                    { label: "Decision cue", message: "The learner should decide whether to fetch first before choosing any integrating command." }
                ]
            }
        }
    }
});

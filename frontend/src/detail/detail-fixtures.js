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
                status: "fixture-stub",
                goal: "Repository context is now authored even before final task copy is delivered.",
                instructions: [],
                steps: []
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
                status: "fixture-stub",
                goal: "Repository cues are now visible in the workspace without final task presentation work.",
                instructions: [],
                steps: []
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
                status: "fixture-stub",
                goal: "Repository context stays concrete while task-copy details remain deferred.",
                instructions: [],
                steps: []
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
                status: "fixture-stub",
                goal: "Repository context visuals are available before final correctness flow exists.",
                instructions: [],
                steps: []
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

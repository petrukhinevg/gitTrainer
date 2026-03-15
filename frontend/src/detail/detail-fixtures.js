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
            stub: true
        },
        workspace: {
            shell: {
                leftPanelTitle: "Scenario map",
                centerPanelTitle: "Workspace lesson",
                rightPanelTitle: "Workspace lane"
            },
            task: {
                status: "fixture-stub",
                goal: "Detail provider seam is active before final task copy is authored.",
                instructions: [],
                steps: []
            },
            repositoryContext: {
                status: "fixture-stub",
                branches: [],
                commits: [],
                files: [],
                annotations: []
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
            stub: true
        },
        workspace: {
            shell: {
                leftPanelTitle: "Scenario map",
                centerPanelTitle: "Workspace lesson",
                rightPanelTitle: "Workspace lane"
            },
            task: {
                status: "fixture-stub",
                goal: "Workspace detail route is now independently loadable through the frontend seam.",
                instructions: [],
                steps: []
            },
            repositoryContext: {
                status: "fixture-stub",
                branches: [],
                commits: [],
                files: [],
                annotations: []
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
            stub: true
        },
        workspace: {
            shell: {
                leftPanelTitle: "Scenario map",
                centerPanelTitle: "Workspace lesson",
                rightPanelTitle: "Workspace lane"
            },
            task: {
                status: "fixture-stub",
                goal: "Exercise route keeps a stable placeholder goal while authored detail is deferred.",
                instructions: [],
                steps: []
            },
            repositoryContext: {
                status: "fixture-stub",
                branches: [],
                commits: [],
                files: [],
                annotations: []
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
            stub: true
        },
        workspace: {
            shell: {
                leftPanelTitle: "Scenario map",
                centerPanelTitle: "Workspace lesson",
                rightPanelTitle: "Workspace lane"
            },
            task: {
                status: "fixture-stub",
                goal: "Provider-backed exercise detail exists even before full repository context rendering.",
                instructions: [],
                steps: []
            },
            repositoryContext: {
                status: "fixture-stub",
                branches: [],
                commits: [],
                files: [],
                annotations: []
            }
        }
    }
});

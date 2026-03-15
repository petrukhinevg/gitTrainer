export const FIXTURE_SCENARIO_CATALOG = Object.freeze({
    items: [
        {
            id: "status-basics",
            slug: "status-basics",
            title: "Read the working tree before acting",
            summary: "Inspect a noisy repository and identify the next safe Git command before making changes.",
            difficulty: "BEGINNER",
            tags: ["status", "working-tree", "basics"]
        },
        {
            id: "branch-safety",
            slug: "branch-safety",
            title: "Choose the right branch before editing",
            summary: "Spot the active branch, compare task intent, and decide whether to stay put or switch first.",
            difficulty: "BEGINNER",
            tags: ["branching", "navigation", "basics"]
        },
        {
            id: "history-cleanup-preview",
            slug: "history-cleanup-preview",
            title: "Preview a history cleanup plan",
            summary: "Read a messy commit stack and prepare for a later cleanup exercise without changing history yet.",
            difficulty: "INTERMEDIATE",
            tags: ["history", "cleanup", "planning"]
        }
    ],
    meta: {
        source: "local-fixture",
        query: {
            difficulty: null,
            tags: [],
            sort: null
        }
    }
});

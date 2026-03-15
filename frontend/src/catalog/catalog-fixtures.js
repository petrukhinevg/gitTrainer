export const FIXTURE_SCENARIO_CATALOG = Object.freeze({
    items: [
        {
            id: "status-basics",
            slug: "status-basics",
            title: "Read the working tree before acting",
            summary: "Inspect a noisy repository and identify the next safe Git command before making changes.",
            difficulty: "beginner",
            tags: ["status", "working-tree", "basics"]
        },
        {
            id: "branch-safety",
            slug: "branch-safety",
            title: "Choose the right branch before editing",
            summary: "Spot the active branch, compare task intent, and decide whether to stay put or switch first.",
            difficulty: "beginner",
            tags: ["branching", "navigation", "basics"]
        },
        {
            id: "history-cleanup-preview",
            slug: "history-cleanup-preview",
            title: "Preview a history cleanup plan",
            summary: "Read a messy commit stack and prepare for a later cleanup exercise without changing history yet.",
            difficulty: "intermediate",
            tags: ["history", "cleanup", "planning"]
        },
        {
            id: "remote-sync-preview",
            slug: "remote-sync-preview",
            title: "Read remote tracking state before you pull",
            summary: "Compare ahead-behind cues and choose whether a fetch or pull makes sense before syncing.",
            difficulty: "intermediate",
            tags: ["remote", "inspection", "planning"]
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

export const CATALOG_TAG_OPTIONS = Object.freeze(
    Array.from(
        new Set(
            FIXTURE_SCENARIO_CATALOG.items.flatMap((item) => item.tags)
        )
    ).sort()
);

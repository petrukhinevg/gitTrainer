export const FIXTURE_PROGRESS_SUMMARY = Object.freeze({
    items: [
        {
            scenarioSlug: "branch-safety",
            scenarioTitle: "Choose the right branch before editing",
            status: "in_progress",
            attemptCount: 1,
            completionCount: 0,
            lastActivityAt: "2026-03-17T00:00:00.000Z"
        },
        {
            scenarioSlug: "status-basics",
            scenarioTitle: "Read the working tree before acting",
            status: "completed",
            attemptCount: 2,
            completionCount: 1,
            lastActivityAt: "2026-03-16T20:30:00.000Z"
        },
        {
            scenarioSlug: "history-cleanup-preview",
            scenarioTitle: "Preview a history cleanup plan",
            status: "not_started",
            attemptCount: 0,
            completionCount: 0,
            lastActivityAt: null
        }
    ],
    recentActivity: [
        {
            scenarioSlug: "branch-safety",
            scenarioTitle: "Choose the right branch before editing",
            status: "in_progress",
            eventType: "attempted",
            happenedAt: "2026-03-17T00:00:00.000Z"
        },
        {
            scenarioSlug: "status-basics",
            scenarioTitle: "Read the working tree before acting",
            status: "completed",
            eventType: "completed",
            happenedAt: "2026-03-16T20:30:00.000Z"
        }
    ],
    recommendations: {
        solved: [
            {
                scenarioSlug: "status-basics",
                scenarioTitle: "Read the working tree before acting"
            }
        ],
        attempted: [
            {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Choose the right branch before editing"
            }
        ],
        next: {
            scenarioSlug: "branch-safety",
            scenarioTitle: "Choose the right branch before editing"
        },
        rationale: "Continue the scenario that already has unresolved progress."
    },
    meta: {
        source: "local-fixture"
    }
});

export const FIXTURE_PROGRESS_SUMMARY = Object.freeze({
    items: [
        {
            scenarioSlug: "branch-safety",
            scenarioTitle: "Выбери правильную ветку перед правками",
            status: "in_progress",
            attemptCount: 1,
            completionCount: 0,
            lastActivityAt: "2026-03-17T00:00:00.000Z"
        },
        {
            scenarioSlug: "status-basics",
            scenarioTitle: "Сначала проверь рабочее дерево",
            status: "completed",
            attemptCount: 2,
            completionCount: 1,
            lastActivityAt: "2026-03-16T20:30:00.000Z"
        },
        {
            scenarioSlug: "history-cleanup-preview",
            scenarioTitle: "Просмотри план очистки истории",
            status: "not_started",
            attemptCount: 0,
            completionCount: 0,
            lastActivityAt: null
        }
    ],
    recentActivity: [
        {
            scenarioSlug: "branch-safety",
            scenarioTitle: "Выбери правильную ветку перед правками",
            status: "in_progress",
            eventType: "attempted",
            happenedAt: "2026-03-17T00:00:00.000Z"
        },
        {
            scenarioSlug: "status-basics",
            scenarioTitle: "Сначала проверь рабочее дерево",
            status: "completed",
            eventType: "completed",
            happenedAt: "2026-03-16T20:30:00.000Z"
        }
    ],
    recommendations: {
        solved: [
            {
                scenarioSlug: "status-basics",
                scenarioTitle: "Сначала проверь рабочее дерево"
            }
        ],
        attempted: [
            {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Выбери правильную ветку перед правками"
            }
        ],
        next: {
            scenarioSlug: "branch-safety",
            scenarioTitle: "Выбери правильную ветку перед правками"
        },
        rationale: "Продолжайте сценарий, в котором уже есть незавершённый прогресс."
    },
    meta: {
        source: "local-fixture"
    }
});

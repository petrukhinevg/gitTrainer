export const FIXTURE_PROGRESS_SUMMARY = Object.freeze({
    items: [
        {
            scenarioSlug: "branch-safety",
            scenarioTitle: "Подтверди ветку и незавершённый hotfix",
            status: "in_progress",
            attemptCount: 1,
            completionCount: 0,
            lastActivityAt: "2026-03-17T00:00:00.000Z"
        },
        {
            scenarioSlug: "status-basics",
            scenarioTitle: "Проверь изменения перед первым Git-действием",
            status: "completed",
            attemptCount: 2,
            completionCount: 1,
            lastActivityAt: "2026-03-16T20:30:00.000Z"
        },
        {
            scenarioSlug: "history-cleanup-preview",
            scenarioTitle: "Собери preview истории перед cleanup",
            status: "not_started",
            attemptCount: 0,
            completionCount: 0,
            lastActivityAt: null
        },
        {
            scenarioSlug: "stash-checkpoint-draft",
            scenarioTitle: "Убери черновик в stash перед переключением",
            status: "not_started",
            attemptCount: 0,
            completionCount: 0,
            lastActivityAt: null
        },
        {
            scenarioSlug: "merge-sandbox-outline",
            scenarioTitle: "Сравни diff перед попыткой merge",
            status: "in_progress",
            attemptCount: 1,
            completionCount: 0,
            lastActivityAt: "2026-03-18T09:15:00.000Z"
        },
        {
            scenarioSlug: "tag-checkpoint-preview",
            scenarioTitle: "Проверь релизные теги перед выбором точки",
            status: "not_started",
            attemptCount: 0,
            completionCount: 0,
            lastActivityAt: null
        }
    ],
    recentActivity: [
        {
            scenarioSlug: "branch-safety",
            scenarioTitle: "Подтверди ветку и незавершённый hotfix",
            status: "in_progress",
            eventType: "attempted",
            happenedAt: "2026-03-17T00:00:00.000Z"
        },
        {
            scenarioSlug: "status-basics",
            scenarioTitle: "Проверь изменения перед первым Git-действием",
            status: "completed",
            eventType: "completed",
            happenedAt: "2026-03-16T20:30:00.000Z"
        },
        {
            scenarioSlug: "merge-sandbox-outline",
            scenarioTitle: "Сравни diff перед попыткой merge",
            status: "in_progress",
            eventType: "attempted",
            happenedAt: "2026-03-18T09:15:00.000Z"
        }
    ],
    recommendations: {
        solved: [
            {
                scenarioSlug: "status-basics",
                scenarioTitle: "Проверь изменения перед первым Git-действием"
            }
        ],
        attempted: [
            {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Подтверди ветку и незавершённый hotfix"
            },
            {
                scenarioSlug: "merge-sandbox-outline",
                scenarioTitle: "Сравни diff перед попыткой merge"
            }
        ],
        next: {
            scenarioSlug: "branch-safety",
            scenarioTitle: "Подтверди ветку и незавершённый hotfix"
        },
        rationale: "Продолжайте сценарий, в котором уже есть незавершённый прогресс."
    },
    meta: {
        source: "local-fixture"
    }
});

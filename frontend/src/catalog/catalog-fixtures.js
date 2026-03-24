export const FIXTURE_SCENARIO_CATALOG = Object.freeze({
    "items": [
        {
            "id": "status-basics",
            "slug": "status-basics",
            "title": "Проверь изменения перед первым Git-действием",
            "summary": "В `main` уже изменены `README.md` и `src/main.js`, а `notes/status-checklist.md` ещё не отслеживается. Сначала покажи короткий статус, а не меняй репозиторий.",
            "difficulty": "beginner",
            "tags": [
                "status",
                "working-tree",
                "basics"
            ]
        },
        {
            "id": "branch-safety",
            "slug": "branch-safety",
            "title": "Подтверди ветку и незавершённый hotfix",
            "summary": "Вы уже на `release/hotfix-7`, а `src/ui/header.css` и `docs/release-checklist.md` изменены. Сначала подтвердите ветку и только потом решайте, можно ли переключаться.",
            "difficulty": "beginner",
            "tags": [
                "branching",
                "navigation",
                "basics"
            ]
        },
        {
            "id": "history-cleanup-preview",
            "slug": "history-cleanup-preview",
            "title": "Собери preview истории перед cleanup",
            "summary": "В `feature/history-cleanup` наверху лежат `fixup!` и WIP-коммиты. Сначала покажи компактный граф истории, а не запускай `rebase -i`.",
            "difficulty": "intermediate",
            "tags": [
                "history",
                "cleanup",
                "planning"
            ]
        },
        {
            "id": "remote-sync-preview",
            "slug": "remote-sync-preview",
            "title": "Сначала обнови `origin/main` перед интеграцией",
            "summary": "Локальная `main` уже ушла вперёд, но данные об `origin/main` могут быть устаревшими. Сначала сделай `fetch`, а уже потом думай про `pull`.",
            "difficulty": "intermediate",
            "tags": [
                "remote",
                "inspection",
                "planning"
            ]
        },
        {
            "id": "stash-checkpoint-draft",
            "slug": "stash-checkpoint-draft",
            "title": "Убери черновик в stash перед переключением",
            "summary": "В `feature/test-stash-panel` изменён `frontend/src/demo-panel.js` и появился новый `notes/ui-placeholder.txt`. Сначала проверь статус, затем сохрани всё в stash вместе с untracked-файлом.",
            "difficulty": "beginner",
            "tags": [
                "stash",
                "working-tree",
                "safety"
            ]
        },
        {
            "id": "merge-sandbox-outline",
            "slug": "merge-sandbox-outline",
            "title": "Сравни diff перед попыткой merge",
            "summary": "Вы на `feature/mock-merge-window` с незавершёнными правками. Перед merge безопасно посмотреть diff с `main` или общий граф веток, а не запускать слияние сразу.",
            "difficulty": "intermediate",
            "tags": [
                "branching",
                "history",
                "planning"
            ]
        },
        {
            "id": "tag-checkpoint-preview",
            "slug": "tag-checkpoint-preview",
            "title": "Проверь релизные теги перед выбором точки",
            "summary": "История чистая, но в репозитории уже есть `release/demo-v1` и `checkpoint/ui-shell`. Сначала посмотри список тегов, а не создавай новый.",
            "difficulty": "beginner",
            "tags": [
                "navigation",
                "inspection",
                "remote"
            ]
        }
    ],
    "meta": {
        "source": "local-fixture",
        "query": {
            "difficulty": null,
            "tags": [],
            "sort": null
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

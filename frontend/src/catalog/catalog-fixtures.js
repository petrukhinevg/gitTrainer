export const FIXTURE_SCENARIO_CATALOG = Object.freeze({
    items: [
        {
            id: "status-basics",
            slug: "status-basics",
            title: "Сначала проверь рабочее дерево",
            summary: "Посмотри на шумный репозиторий и выбери следующую безопасную Git-команду до любых изменений.",
            difficulty: "beginner",
            tags: ["status", "working-tree", "basics"]
        },
        {
            id: "branch-safety",
            slug: "branch-safety",
            title: "Выбери правильную ветку перед правками",
            summary: "Определи активную ветку, сопоставь её с задачей и реши, оставаться ли на месте или сначала переключиться.",
            difficulty: "beginner",
            tags: ["branching", "navigation", "basics"]
        },
        {
            id: "history-cleanup-preview",
            slug: "history-cleanup-preview",
            title: "Просмотри план очистки истории",
            summary: "Разбери запутанный стек коммитов и подготовься к дальнейшей очистке, пока ещё не меняя историю.",
            difficulty: "intermediate",
            tags: ["history", "cleanup", "planning"]
        },
        {
            id: "remote-sync-preview",
            slug: "remote-sync-preview",
            title: "Проверь удалённое состояние перед pull",
            summary: "Сравни признаки опережения и отставания и реши, что уместнее перед синхронизацией: fetch или pull.",
            difficulty: "intermediate",
            tags: ["remote", "inspection", "planning"]
        },
        {
            id: "stash-checkpoint-draft",
            slug: "stash-checkpoint-draft",
            title: "Тестовый блок про временное сохранение",
            summary: "Добавочный fixture-блок для проверки UI: ещё один родитель с несколькими дочерними шагами и нейтральным текстом.",
            difficulty: "beginner",
            tags: ["status", "cleanup", "planning"]
        },
        {
            id: "merge-sandbox-outline",
            slug: "merge-sandbox-outline",
            title: "Тестовый блок про слияние без спешки",
            summary: "Служебный сценарий для тестирования навигации: раскрывается как обычный блок, но несёт упрощённый учебный текст.",
            difficulty: "intermediate",
            tags: ["branching", "history", "planning"]
        },
        {
            id: "tag-checkpoint-preview",
            slug: "tag-checkpoint-preview",
            title: "Тестовый блок про теги и ориентиры",
            summary: "Ещё один fixture-родитель для проверки длинной ленты: внутри только тестовые шаги без особой смысловой нагрузки.",
            difficulty: "beginner",
            tags: ["navigation", "inspection", "remote"]
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

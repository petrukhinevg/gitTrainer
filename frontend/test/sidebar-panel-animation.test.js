import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { renderSidebarPanelContent } from "../src/workspace-shell/view/sidebar-panel.js";

test("раскрытые дочерние блоки получают последовательные индексы для stagger-анимации", () => {
    const markup = renderSidebarPanelContent(createReadyState({ expandingScenarioSlug: "branch-safety" }), null, ["branching", "navigation"]);
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);

    try {
        const subtasks = Array.from(dom.window.document.querySelectorAll(".flow-subtask-group > .flow-block--subtask"));

        assert.equal(subtasks.length, 3);
        assert.deepEqual(
            subtasks.map((entry) => entry.style.getPropertyValue("--flow-subtask-enter-index")),
            ["0", "1", "2"]
        );
        assert.ok(subtasks.every((entry) => entry.dataset.flowSubtaskEnter === "true"));
    } finally {
        dom.window.close();
    }
});

test("анимационные индексы не навешиваются на уже раскрытые соседние группы", () => {
    const markup = renderSidebarPanelContent(
        createReadyState({
            expandingScenarioSlug: "remote-sync-preview",
            expandedScenarioSlugs: ["branch-safety", "remote-sync-preview"],
            catalogItems: [
                {
                    slug: "branch-safety",
                    title: "Подтверди текущую ветку",
                    tags: ["branching", "navigation"]
                },
                {
                    slug: "remote-sync-preview",
                    title: "Синхронизируй удалённое состояние",
                    tags: ["remote", "planning"]
                }
            ],
            detailCache: {
                "branch-safety": createDetailCacheEntry(["Проверь ветку"]),
                "remote-sync-preview": createDetailCacheEntry(["Сделай fetch", "Проверь ahead/behind"])
            }
        }),
        null,
        ["branching", "navigation", "remote", "planning"]
    );
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);

    try {
        const firstScenarioAnimatedNodes = dom.window.document.querySelectorAll(
            '[data-scenario-panel="branch-safety"] [data-flow-subtask-enter="true"]'
        );
        const secondScenarioAnimatedNodes = Array.from(
            dom.window.document.querySelectorAll('[data-scenario-panel="remote-sync-preview"] [data-flow-subtask-enter="true"]')
        );

        assert.equal(firstScenarioAnimatedNodes.length, 0);
        assert.deepEqual(
            secondScenarioAnimatedNodes.map((entry) => entry.style.getPropertyValue("--flow-subtask-enter-index")),
            ["0", "1", "2"]
        );
    } finally {
        dom.window.close();
    }
});

test("раскрытая соседняя группа берёт подзадачи из своего cache, а не из detail предыдущего сценария", () => {
    const markup = renderSidebarPanelContent(
        createReadyState({
            selectedScenarioSlug: "remote-sync-preview",
            expandedScenarioSlugs: ["branch-safety", "remote-sync-preview"],
            catalogItems: [
                {
                    slug: "branch-safety",
                    title: "Подтверди текущую ветку",
                    tags: ["branching", "navigation"]
                },
                {
                    slug: "remote-sync-preview",
                    title: "Синхронизируй удалённое состояние",
                    tags: ["remote", "planning"]
                }
            ],
            detail: createSelectedDetailState("branch-safety", ["Проверь ветку", "Сверь изменения"]),
            detailCache: {
                "branch-safety": createDetailCacheEntry(["Проверь ветку", "Сверь изменения"]),
                "remote-sync-preview": createDetailCacheEntry(["Сделай fetch", "Проверь ahead/behind"])
            }
        }),
        null,
        ["branching", "navigation", "remote", "planning"]
    );
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);

    try {
        const remoteTitles = Array.from(
            dom.window.document.querySelectorAll('[data-scenario-panel="remote-sync-preview"] .flow-block__title')
        ).map((entry) => entry.textContent?.trim());

        assert.deepEqual(remoteTitles, ["Обзор", "Сделай fetch", "Проверь ahead/behind"]);
    } finally {
        dom.window.close();
    }
});

function createReadyState({
    expandingScenarioSlug = null,
    expandedScenarioSlugs = ["branch-safety"],
    catalogItems = [
        {
            slug: "branch-safety",
            title: "Подтверди текущую ветку",
            tags: ["branching", "navigation"]
        }
    ],
    detailCache = {
        "branch-safety": createDetailCacheEntry(["Проверь ветку", "Сверь изменения"])
    },
    selectedScenarioSlug = null,
    detail = createSelectedDetailState()
} = {}) {
    return {
        route: "exercise",
        providerName: "backend-api",
        catalog: {
            status: "ready",
            items: catalogItems
        },
        expandedScenarioSlugs,
        expandingScenarioSlug,
        selectedScenarioSlug,
        selectedFocus: null,
        pinnedNavigationTag: null,
        detail,
        detailCache
    };
}

function createDetailCacheEntry(stepTitles) {
    return {
        status: "ready",
        data: {
            workspace: {
                task: {
                    steps: stepTitles.map((title, index) => ({
                        position: index + 1,
                        title
                    }))
                }
            }
        },
        error: null
    };
}

function createSelectedDetailState(scenarioSlug = null, stepTitles = []) {
    if (!scenarioSlug) {
        return {
            status: "idle",
            data: null,
            error: null,
            scenarioSlug: null
        };
    }

    return {
        status: "ready",
        data: {
            workspace: {
                task: {
                    steps: stepTitles.map((title, index) => ({
                        position: index + 1,
                        title
                    }))
                }
            }
        },
        error: null,
        scenarioSlug
    };
}

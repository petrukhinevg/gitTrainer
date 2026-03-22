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
    }
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
        selectedScenarioSlug: null,
        selectedFocus: null,
        pinnedNavigationTag: null,
        detail: {
            status: "idle",
            data: null,
            error: null
        },
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

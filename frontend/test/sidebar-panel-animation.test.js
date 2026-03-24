import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { renderSidebarPanelContent } from "../src/workspace-shell/view/sidebar-panel.js";

test("песочница рендерится сразу после блока прогресса", () => {
    const markup = renderSidebarPanelContent(
        createReadyState({
            route: "catalog",
            catalogItems: [
                {
                    slug: "merge-sandbox-outline",
                    title: "Тестовый sandbox",
                    tags: ["branching", "planning"]
                },
                {
                    slug: "branch-safety",
                    title: "Подтверди текущую ветку",
                    tags: ["branching", "navigation"]
                }
            ]
        }),
        null,
        ["branching", "navigation", "planning"]
    );
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);

    try {
        const links = Array.from(dom.window.document.querySelectorAll(".flow-block-list > a[href]"));
        const sandboxScenarioToggle = dom.window.document.querySelector('[data-scenario-toggle="merge-sandbox-outline"]');

        assert.deepEqual(
            links.map((link) => link.getAttribute("href")),
            ["#/catalog", "#/progress", "#/sandbox"]
        );
        assert.equal(sandboxScenarioToggle, null);
    } finally {
        dom.window.close();
    }
});

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

test("при удержании тега неподходящие сценарии остаются в DOM, но переходят в скрытое состояние", () => {
    const markup = renderSidebarPanelContent(
        createReadyState({
            heldNavigationTag: "branching",
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
                "branch-safety": createDetailCacheEntry(["Проверь ветку", "Сверь изменения"]),
                "remote-sync-preview": createDetailCacheEntry(["Сделай fetch", "Проверь ahead/behind"])
            }
        }),
        null,
        ["branching", "navigation", "remote", "planning"]
    );
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);

    try {
        assert.equal(
            dom.window.document.querySelector('[data-scenario-toggle="branch-safety"]')?.closest(".flow-node")?.dataset.flowNodeFiltered,
            "false"
        );
        assert.equal(
            dom.window.document.querySelector('[data-scenario-toggle="remote-sync-preview"]')?.closest(".flow-node")?.dataset.flowNodeFiltered,
            "true"
        );
        assert.ok(dom.window.document.querySelector('[data-scenario-panel="branch-safety"]'));
    } finally {
        dom.window.close();
    }
});

test("между тегами и заданиями рендерится разделитель с toggle для collapse-all", () => {
    const markup = renderSidebarPanelContent(
        createReadyState({
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
                "remote-sync-preview": createDetailCacheEntry(["Сделай fetch"])
            }
        }),
        null,
        ["branching", "navigation", "remote", "planning"]
    );
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);

    try {
        const divider = dom.window.document.querySelector(".scenario-flow-divider");
        const button = dom.window.document.querySelector("[data-navigation-collapse-all-toggle]");

        assert.ok(divider, "Между legend и списком должен появиться разделитель");
        assert.ok(button, "В разделителе должна быть кнопка collapse-all");
        assert.equal(button?.getAttribute("data-navigation-collapse-all-toggle"), "collapse");
        assert.equal(button?.textContent?.trim(), "-");
    } finally {
        dom.window.close();
    }
});

function createReadyState({
    expandingScenarioSlug = null,
    expandedScenarioSlugs = ["branch-safety"],
    heldNavigationTag = null,
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
        collapsedNavigationScenarioSnapshot: null,
        selectedScenarioSlug,
        selectedFocus: null,
        pinnedNavigationTag: null,
        heldNavigationTag,
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

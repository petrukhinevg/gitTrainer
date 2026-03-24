import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { createBackendApiCatalogProvider } from "../src/catalog/catalog-provider.js";
import { createBackendApiDetailProvider } from "../src/detail/detail-provider.js";
import { createBackendApiProgressProvider } from "../src/progress/progress-provider.js";
import { createBackendApiSessionProvider } from "../src/session/session-provider.js";
import { createCatalogWorkspaceController } from "../src/workspace-shell/controller.js";

test("средняя кнопка на теге фиксирует выбор и повторным нажатием возвращает предыдущее состояние", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");

    dom.window.matchMedia = () => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
    });

    const fetchImpl = async (url) => {
        const requestUrl = new URL(url);

        if (requestUrl.pathname === "/api/scenarios") {
            return jsonResponse({
                items: [
                    {
                        id: "branch-safety",
                        slug: "branch-safety",
                        title: "Подтверди текущую ветку",
                        summary: "Тестовый сценарий по веткам.",
                        difficulty: "beginner",
                        tags: ["branching", "navigation"]
                    },
                    {
                        id: "remote-sync-preview",
                        slug: "remote-sync-preview",
                        title: "Сделай fetch первым",
                        summary: "Тестовый сценарий по удалённому состоянию.",
                        difficulty: "intermediate",
                        tags: ["remote", "planning"]
                    }
                ],
                meta: {
                    source: "db-seeded",
                    query: {}
                }
            });
        }

        if (requestUrl.pathname === "/api/scenarios/branch-safety") {
            return jsonResponse(createDetailPayload("Подтверди ветку", ["Проверь ветку", "Сверь контекст"]));
        }

        if (requestUrl.pathname === "/api/scenarios/remote-sync-preview") {
            return jsonResponse(createDetailPayload("Сделай fetch первым", ["Обнови refs", "Проверь divergence"]));
        }

        if (requestUrl.pathname === "/api/progress") {
            return jsonResponse({
                items: [],
                recentActivity: [],
                recommendations: null,
                meta: { source: "db-seeded" }
            });
        }

        throw new Error(`Unexpected request: ${requestUrl.pathname}`);
    };

    try {
        const controller = createCatalogWorkspaceController({
            appRoot,
            defaultProviderName: "backend-api",
            catalogProviderFactories: {
                "backend-api": () => createBackendApiCatalogProvider(fetchImpl)
            },
            detailProviderFactories: {
                "backend-api": () => createBackendApiDetailProvider(fetchImpl)
            },
            sessionProviderFactories: {
                "backend-api": () => createBackendApiSessionProvider(fetchImpl)
            },
            progressProviderFactories: {
                "backend-api": () => createBackendApiProgressProvider(fetchImpl)
            },
            tagOptions: ["branching", "navigation", "remote", "planning"]
        });

        await controller.bootstrap();
        await flushAsyncWork();

        const tagButton = appRoot.querySelector('[data-tag-legend-control="branching"]');
        assert.ok(tagButton, "Кнопка тега должна быть доступна");
        assert.ok(appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]'));

        tagButton.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 1
        }));
        await flushAsyncWork();

        const branchButtonAfterMiddleClick = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        assert.ok(branchButtonAfterMiddleClick, "Подходящий сценарий должен оставаться видимым");
        assert.equal(branchButtonAfterMiddleClick.getAttribute("aria-expanded"), "true");
        const remoteButtonAfterMiddleClick = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');
        assert.ok(remoteButtonAfterMiddleClick, "Неподходящий сценарий должен оставаться в DOM для анимации");
        assert.equal(
            remoteButtonAfterMiddleClick.closest(".flow-node")?.dataset.flowNodeFiltered,
            "true",
            "Неподходящий сценарий должен переходить в скрытое состояние после фиксации тега"
        );
        assert.ok(appRoot.querySelector('[data-scenario-panel="branch-safety"]'));

        dom.window.dispatchEvent(new dom.window.MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            button: 1
        }));
        await flushAsyncWork();

        assert.ok(
            appRoot.querySelector('[data-scenario-toggle="branch-safety"]'),
            "После отпускания средней кнопки выбранный тег должен оставаться зафиксированным"
        );
        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]')?.closest(".flow-node")?.dataset.flowNodeFiltered,
            "true",
            "Отпускание средней кнопки не должно отменять фильтрацию"
        );

        tagButton.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 1
        }));
        await flushAsyncWork();

        assert.ok(
            appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]'),
            "Повторное нажатие средней кнопки должно вернуть ранее скрытые сценарии"
        );
        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]')?.closest(".flow-node")?.dataset.flowNodeFiltered,
            "false",
            "После повторного нажатия ранее скрытый сценарий должен выйти из filtered-состояния"
        );
        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="branch-safety"]')?.getAttribute("aria-expanded"),
            "false",
            "После повторного нажатия состояние раскрытия должно вернуться к исходному"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("средняя кнопка на новом теге сбрасывает закрепление, поставленное левой кнопкой", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");

    dom.window.matchMedia = () => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
    });

    const fetchImpl = createFetchImpl();

    try {
        const controller = createCatalogWorkspaceController({
            appRoot,
            defaultProviderName: "backend-api",
            catalogProviderFactories: {
                "backend-api": () => createBackendApiCatalogProvider(fetchImpl)
            },
            detailProviderFactories: {
                "backend-api": () => createBackendApiDetailProvider(fetchImpl)
            },
            sessionProviderFactories: {
                "backend-api": () => createBackendApiSessionProvider(fetchImpl)
            },
            progressProviderFactories: {
                "backend-api": () => createBackendApiProgressProvider(fetchImpl)
            },
            tagOptions: ["branching", "navigation", "remote", "planning"]
        });

        await controller.bootstrap();
        await flushAsyncWork();

        appRoot.querySelector('[data-tag-legend-control="branching"]')?.click();
        await flushAsyncWork();

        assert.equal(
            appRoot.querySelector('[data-tag-legend-control="branching"]')?.getAttribute("aria-pressed"),
            "true",
            "После левого клика тег должен перейти в закреплённое состояние"
        );

        appRoot.querySelector('[data-tag-legend-control="remote"]')?.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 1
        }));
        await flushAsyncWork();

        assert.equal(
            appRoot.querySelector('[data-tag-legend-control="branching"]')?.getAttribute("aria-pressed"),
            "false",
            "Middle-click должен снять предыдущее закрепление левой кнопкой"
        );
        assert.equal(
            appRoot.querySelector('[data-tag-legend-control="remote"]')?.getAttribute("aria-pressed"),
            "true",
            "Новый тег должен стать активным после middle-click"
        );
        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="branch-safety"]')?.closest(".flow-node")?.dataset.flowNodeFiltered,
            "true",
            "После middle-click должен остаться только фильтр нового тега"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("левый клик по активному middle-фильтру сразу снимает его и оставляет тег закреплённым", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");

    dom.window.matchMedia = () => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
    });

    const fetchImpl = createFetchImpl();

    try {
        const controller = createCatalogWorkspaceController({
            appRoot,
            defaultProviderName: "backend-api",
            catalogProviderFactories: {
                "backend-api": () => createBackendApiCatalogProvider(fetchImpl)
            },
            detailProviderFactories: {
                "backend-api": () => createBackendApiDetailProvider(fetchImpl)
            },
            sessionProviderFactories: {
                "backend-api": () => createBackendApiSessionProvider(fetchImpl)
            },
            progressProviderFactories: {
                "backend-api": () => createBackendApiProgressProvider(fetchImpl)
            },
            tagOptions: ["branching", "navigation", "remote", "planning"]
        });

        await controller.bootstrap();
        await flushAsyncWork();

        appRoot.querySelector('[data-tag-legend-control="branching"]')?.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 1
        }));
        await flushAsyncWork();

        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]')?.closest(".flow-node")?.dataset.flowNodeFiltered,
            "true",
            "Перед левым кликом фильтр middle-click должен скрывать неподходящий сценарий"
        );

        appRoot.querySelector('[data-tag-legend-control="branching"]')?.click();
        await flushAsyncWork();

        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]')?.closest(".flow-node")?.dataset.flowNodeFiltered,
            "false",
            "Левый клик должен снять middle-фильтр и вернуть все сценарии"
        );
        assert.equal(
            appRoot.querySelector('[data-tag-legend-control="branching"]')?.getAttribute("aria-pressed"),
            "true",
            "Тот же левый клик должен сразу оставить тег закреплённым"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("при снятии middle-фильтра без движения мыши hover-подсветка тега сохраняется", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");

    dom.window.matchMedia = () => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
    });

    const fetchImpl = createFetchImpl();

    try {
        const controller = createCatalogWorkspaceController({
            appRoot,
            defaultProviderName: "backend-api",
            catalogProviderFactories: {
                "backend-api": () => createBackendApiCatalogProvider(fetchImpl)
            },
            detailProviderFactories: {
                "backend-api": () => createBackendApiDetailProvider(fetchImpl)
            },
            sessionProviderFactories: {
                "backend-api": () => createBackendApiSessionProvider(fetchImpl)
            },
            progressProviderFactories: {
                "backend-api": () => createBackendApiProgressProvider(fetchImpl)
            },
            tagOptions: ["branching", "navigation", "remote", "planning"]
        });

        await controller.bootstrap();
        await flushAsyncWork();

        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const branchingTagButton = appRoot.querySelector('[data-tag-legend-control="branching"]');

        branchingTagButton?.dispatchEvent(new dom.window.MouseEvent("mouseenter", {
            bubbles: true,
            cancelable: true
        }));
        await flushAsyncWork();

        branchingTagButton?.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 1
        }));
        await flushAsyncWork();

        branchingTagButton?.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 1
        }));
        await flushAsyncWork();

        assert.equal(
            navigationLane?.dataset.highlightTag,
            "branching",
            "Hover-подсветка должна сохраняться, пока курсор остаётся над тегом"
        );
        assert.equal(
            navigationLane?.hasAttribute("data-pinned-tag"),
            false,
            "После снятия middle-фильтра pinned-состояние должно быть очищено"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("после снятия middle-фильтра можно сразу закрепить тег левой кнопкой", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");

    dom.window.matchMedia = () => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
    });

    const fetchImpl = createFetchImpl();

    try {
        const controller = createCatalogWorkspaceController({
            appRoot,
            defaultProviderName: "backend-api",
            catalogProviderFactories: {
                "backend-api": () => createBackendApiCatalogProvider(fetchImpl)
            },
            detailProviderFactories: {
                "backend-api": () => createBackendApiDetailProvider(fetchImpl)
            },
            sessionProviderFactories: {
                "backend-api": () => createBackendApiSessionProvider(fetchImpl)
            },
            progressProviderFactories: {
                "backend-api": () => createBackendApiProgressProvider(fetchImpl)
            },
            tagOptions: ["branching", "navigation", "remote", "planning"]
        });

        await controller.bootstrap();
        await flushAsyncWork();

        appRoot.querySelector('[data-tag-legend-control="branching"]')?.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 1
        }));
        await flushAsyncWork();

        appRoot.querySelector('[data-tag-legend-control="branching"]')?.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 1
        }));
        await flushAsyncWork();

        appRoot.querySelector('[data-tag-legend-control="branching"]')?.click();
        await flushAsyncWork();

        assert.equal(
            appRoot.querySelector('[data-tag-legend-control="branching"]')?.getAttribute("aria-pressed"),
            "true",
            "Сразу после middle-off левый клик должен закреплять тот же тег"
        );
        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]')?.closest(".flow-node")?.dataset.flowNodeFiltered,
            "false",
            "После left-pin обычный список сценариев не должен переходить в middle-filter режим"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

function createFetchImpl() {
    return async (url) => {
        const requestUrl = new URL(url);

        if (requestUrl.pathname === "/api/scenarios") {
            return jsonResponse({
                items: [
                    {
                        id: "branch-safety",
                        slug: "branch-safety",
                        title: "Подтверди текущую ветку",
                        summary: "Тестовый сценарий по веткам.",
                        difficulty: "beginner",
                        tags: ["branching", "navigation"]
                    },
                    {
                        id: "remote-sync-preview",
                        slug: "remote-sync-preview",
                        title: "Сделай fetch первым",
                        summary: "Тестовый сценарий по удалённому состоянию.",
                        difficulty: "intermediate",
                        tags: ["remote", "planning"]
                    }
                ],
                meta: {
                    source: "db-seeded",
                    query: {}
                }
            });
        }

        if (requestUrl.pathname === "/api/scenarios/branch-safety") {
            return jsonResponse(createDetailPayload("Подтверди ветку", ["Проверь ветку", "Сверь контекст"]));
        }

        if (requestUrl.pathname === "/api/scenarios/remote-sync-preview") {
            return jsonResponse(createDetailPayload("Сделай fetch первым", ["Обнови refs", "Проверь divergence"]));
        }

        if (requestUrl.pathname === "/api/progress") {
            return jsonResponse({
                items: [],
                recentActivity: [],
                recommendations: null,
                meta: { source: "db-seeded" }
            });
        }

        throw new Error(`Unexpected request: ${requestUrl.pathname}`);
    };
}

function createDetailPayload(title, stepTitles) {
    return {
        slug: title,
        title,
        summary: "detail",
        difficulty: "beginner",
        tags: [],
        meta: {
            source: "db-seeded"
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "db-seeded",
                goal: "goal",
                instructions: [],
                steps: stepTitles.map((stepTitle, index) => ({
                    position: index + 1,
                    title: stepTitle,
                    detail: stepTitle
                })),
                annotations: []
            },
            repositoryContext: {
                status: "db-seeded",
                branches: [],
                commits: [],
                files: [],
                annotations: []
            }
        }
    };
}

async function flushAsyncWork(iterations = 6) {
    for (let index = 0; index < iterations; index += 1) {
        await Promise.resolve();
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
}

function jsonResponse(payload) {
    return {
        ok: true,
        status: 200,
        headers: {
            get(name) {
                return String(name).toLowerCase() === "content-type" ? "application/json" : null;
            }
        },
        async json() {
            return payload;
        },
        async text() {
            return JSON.stringify(payload);
        }
    };
}

function installDomGlobals(windowLike) {
    const previousGlobals = new Map();
    const bindings = {
        window: windowLike,
        document: windowLike.document,
        location: windowLike.location,
        history: windowLike.history,
        FormData: windowLike.FormData,
        Event: windowLike.Event,
        MouseEvent: windowLike.MouseEvent,
        HashChangeEvent: windowLike.HashChangeEvent,
        Node: windowLike.Node,
        Element: windowLike.Element,
        HTMLElement: windowLike.HTMLElement,
        HTMLInputElement: windowLike.HTMLInputElement,
        HTMLTextAreaElement: windowLike.HTMLTextAreaElement,
        HTMLSelectElement: windowLike.HTMLSelectElement,
        WheelEvent: windowLike.WheelEvent,
        DOMTokenList: windowLike.DOMTokenList,
        requestAnimationFrame: (callback) => callback(Date.now()),
        cancelAnimationFrame: () => {},
        ResizeObserver: class {
            observe() {}
            disconnect() {}
        }
    };

    windowLike.requestAnimationFrame = bindings.requestAnimationFrame;
    windowLike.cancelAnimationFrame = bindings.cancelAnimationFrame;

    Object.entries(bindings).forEach(([key, value]) => {
        previousGlobals.set(
            key,
            Object.prototype.hasOwnProperty.call(globalThis, key) ? globalThis[key] : undefined
        );
        globalThis[key] = value;
    });

    return () => {
        Object.keys(bindings).forEach((key) => {
            const previousValue = previousGlobals.get(key);
            if (typeof previousValue === "undefined") {
                delete globalThis[key];
                return;
            }

            globalThis[key] = previousValue;
        });
    };
}

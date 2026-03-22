import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { createBackendApiCatalogProvider } from "../src/catalog/catalog-provider.js";
import { createBackendApiDetailProvider } from "../src/detail/detail-provider.js";
import { createBackendApiProgressProvider } from "../src/progress/progress-provider.js";
import { createBackendApiSessionProvider } from "../src/session/session-provider.js";
import { createCatalogWorkspaceController } from "../src/workspace-shell/controller.js";

test("при сворачивании сценария левая панель не пересобирает соседние блоки", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    dom.window.matchMedia = () => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
    });

    const appRoot = dom.window.document.querySelector("#app");
    const fetchImpl = async (url) => {
        const requestUrl = new URL(url);

        if (requestUrl.pathname === "/api/scenarios") {
            return jsonResponse(createCatalogPayload());
        }

        if (requestUrl.pathname === "/api/scenarios/branch-safety") {
            return jsonResponse(createBranchSafetyDetailPayload());
        }

        if (requestUrl.pathname === "/api/scenarios/remote-sync-preview") {
            return jsonResponse(createRemoteSyncDetailPayload());
        }

        if (requestUrl.pathname === "/api/progress") {
            return jsonResponse({
                items: [],
                recentActivity: [],
                recommendations: null,
                meta: { source: "mvp-fixture" }
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

        const scenarioButton = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        assert.ok(scenarioButton, "Кнопка сценария должна быть доступна");
        scenarioButton.click();
        await flushAsyncWork();

        const scenarioButtonBeforeCollapse = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const siblingButtonBeforeCollapse = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');
        assert.ok(appRoot.querySelector('[data-scenario-panel="branch-safety"]'), "Подзадачи должны появиться после раскрытия");

        scenarioButtonBeforeCollapse.click();
        await flushAsyncWork();

        const scenarioButtonAfterCollapse = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const siblingButtonAfterCollapse = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');

        assert.equal(
            scenarioButtonAfterCollapse,
            scenarioButtonBeforeCollapse,
            "Сворачиваемый блок не должен заменяться новым DOM-узлом"
        );
        assert.equal(
            siblingButtonAfterCollapse,
            siblingButtonBeforeCollapse,
            "Соседние блоки не должны пересобираться при сворачивании"
        );
        assert.equal(scenarioButtonAfterCollapse.getAttribute("aria-expanded"), "false");
        assert.equal(
            scenarioButtonAfterCollapse.querySelector(".flow-block__indicator")?.textContent,
            ">"
        );
        assert.equal(appRoot.querySelector('[data-scenario-panel="branch-safety"]'), null);

        scenarioButtonAfterCollapse.click();
        await flushAsyncWork();

        assert.ok(
            appRoot.querySelector('[data-scenario-panel="branch-safety"]'),
            "Тот же блок должен снова раскрываться без переключения на соседний"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("при выборе дочернего блока уже открытые группы в навигации не пересоздаются", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    dom.window.matchMedia = () => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
    });
    const appRoot = dom.window.document.querySelector("#app");
    const fetchImpl = async (url) => {
        const requestUrl = new URL(url);

        if (requestUrl.pathname === "/api/scenarios") {
            return jsonResponse(createCatalogPayload());
        }

        if (requestUrl.pathname === "/api/scenarios/branch-safety") {
            return jsonResponse(createBranchSafetyDetailPayload());
        }

        if (requestUrl.pathname === "/api/scenarios/remote-sync-preview") {
            return jsonResponse(createRemoteSyncDetailPayload());
        }

        if (requestUrl.pathname === "/api/progress") {
            return jsonResponse({
                items: [],
                recentActivity: [],
                recommendations: null,
                meta: { source: "mvp-fixture" }
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
        await navigateToHash(dom.window, "#/exercise/branch-safety");
        await flushAsyncWork();

        const remoteScenarioButton = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');
        assert.ok(remoteScenarioButton, "Кнопка соседнего сценария должна быть доступна");
        remoteScenarioButton.click();
        await flushAsyncWork();

        const branchPanelBeforeSelection = appRoot.querySelector('[data-scenario-panel="branch-safety"]');
        const remotePanelBeforeSelection = appRoot.querySelector('[data-scenario-panel="remote-sync-preview"]');
        const overviewLinkBeforeSelection = appRoot.querySelector(
            '[data-scenario-panel="branch-safety"] [data-scenario-focus="overview"]'
        );
        const stepLinkBeforeSelection = appRoot.querySelector(
            '[data-scenario-panel="branch-safety"] [data-scenario-focus="step-1"]'
        );

        assert.ok(branchPanelBeforeSelection, "Активный сценарий должен оставаться раскрытым");
        assert.ok(remotePanelBeforeSelection, "Соседний сценарий должен раскрыться");
        assert.ok(overviewLinkBeforeSelection?.classList.contains("flow-block--active"));
        assert.ok(stepLinkBeforeSelection, "Должна быть доступна ссылка на шаг сценария");

        stepLinkBeforeSelection.click();
        await flushAsyncWork();

        const branchPanelAfterSelection = appRoot.querySelector('[data-scenario-panel="branch-safety"]');
        const remotePanelAfterSelection = appRoot.querySelector('[data-scenario-panel="remote-sync-preview"]');
        const overviewLinkAfterSelection = appRoot.querySelector(
            '[data-scenario-panel="branch-safety"] [data-scenario-focus="overview"]'
        );
        const stepLinkAfterSelection = appRoot.querySelector(
            '[data-scenario-panel="branch-safety"] [data-scenario-focus="step-1"]'
        );

        assert.equal(
            branchPanelAfterSelection,
            branchPanelBeforeSelection,
            "Открытая группа выбранного сценария не должна пересоздаваться"
        );
        assert.equal(
            remotePanelAfterSelection,
            remotePanelBeforeSelection,
            "Соседняя открытая группа не должна пересоздаваться"
        );
        assert.equal(
            stepLinkAfterSelection,
            stepLinkBeforeSelection,
            "Ссылка на шаг должна сохранять тот же DOM-узел"
        );
        assert.ok(stepLinkAfterSelection.classList.contains("flow-block--active"));
        assert.ok(!overviewLinkAfterSelection.classList.contains("flow-block--active"));
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

function createCatalogPayload() {
    return {
        items: [
            {
                id: "branch-safety",
                slug: "branch-safety",
                title: "Подтверди текущую ветку перед правками",
                summary: "Сначала выясни, на какой ветке уже есть незавершённые изменения.",
                difficulty: "beginner",
                tags: ["branching", "navigation"]
            },
            {
                id: "remote-sync-preview",
                slug: "remote-sync-preview",
                title: "Сначала обнови удалённое состояние",
                summary: "Начни с fetch, а не с немедленного pull.",
                difficulty: "intermediate",
                tags: ["remote", "planning"]
            }
        ],
        meta: {
            source: "mvp-fixture",
            query: {}
        }
    };
}

function createBranchSafetyDetailPayload() {
    return createDetailPayload({
        slug: "branch-safety",
        title: "Подтверди текущую ветку перед правками",
        stepTitle: "Подтвердите текущую ветку"
    });
}

function createRemoteSyncDetailPayload() {
    return createDetailPayload({
        slug: "remote-sync-preview",
        title: "Сначала обнови удалённое состояние",
        stepTitle: "Освежите удалённые ссылки"
    });
}

function createDetailPayload({ slug, title, stepTitle }) {
    return {
        id: slug,
        slug,
        title,
        summary: title,
        difficulty: "beginner",
        tags: [],
        meta: {
            source: "mvp-fixture",
            stub: true
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "authored-fixture",
                goal: title,
                instructions: [
                    {
                        id: `${slug}-instruction`,
                        text: title
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: stepTitle,
                        detail: stepTitle
                    }
                ],
                annotations: []
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [],
                commits: [],
                files: [],
                annotations: []
            }
        }
    };
}

function jsonResponse(payload, { status = 200 } = {}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get(name) {
                return String(name).toLowerCase() === "content-type"
                    ? "application/json; charset=utf-8"
                    : null;
            }
        },
        async json() {
            return structuredClone(payload);
        }
    };
}

async function flushAsyncWork(iterations = 6) {
    for (let index = 0; index < iterations; index += 1) {
        await Promise.resolve();
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
}

async function navigateToHash(windowLike, nextHash) {
    windowLike.history.pushState(null, "", nextHash);
    windowLike.dispatchEvent(new windowLike.HashChangeEvent("hashchange"));
    await flushAsyncWork();
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

    windowLike.matchMedia = () => ({
        matches: false,
        media: "",
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
    });
    windowLike.requestAnimationFrame = bindings.requestAnimationFrame;
    windowLike.cancelAnimationFrame = bindings.cancelAnimationFrame;

    Object.entries(bindings).forEach(([key, value]) => {
        previousGlobals.set(key, Object.prototype.hasOwnProperty.call(globalThis, key)
            ? globalThis[key]
            : undefined);
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

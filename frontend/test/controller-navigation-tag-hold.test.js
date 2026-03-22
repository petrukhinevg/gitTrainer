import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { createBackendApiCatalogProvider } from "../src/catalog/catalog-provider.js";
import { createBackendApiDetailProvider } from "../src/detail/detail-provider.js";
import { createBackendApiProgressProvider } from "../src/progress/progress-provider.js";
import { createBackendApiSessionProvider } from "../src/session/session-provider.js";
import { createCatalogWorkspaceController } from "../src/workspace-shell/controller.js";

test("удержание тега временно раскрывает подходящие сценарии и скрывает остальные", async () => {
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
                    source: "mvp-fixture",
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

        const tagButton = appRoot.querySelector('[data-tag-legend-control="branching"]');
        assert.ok(tagButton, "Кнопка тега должна быть доступна");
        assert.ok(appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]'));

        tagButton.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 0
        }));
        await wait(dom.window, 220);
        await flushAsyncWork();

        const branchButtonDuringHold = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        assert.ok(branchButtonDuringHold, "Подходящий сценарий должен оставаться видимым");
        assert.equal(branchButtonDuringHold.getAttribute("aria-expanded"), "true");
        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]'),
            null,
            "Неподходящий сценарий должен временно скрываться"
        );
        assert.ok(appRoot.querySelector('[data-scenario-panel="branch-safety"]'));

        dom.window.dispatchEvent(new dom.window.MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            button: 0
        }));
        await flushAsyncWork();

        assert.ok(
            appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]'),
            "После отпускания тега скрытые сценарии должны вернуться"
        );
        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="branch-safety"]')?.getAttribute("aria-expanded"),
            "false",
            "После отпускания тег не должен оставлять сценарий раскрытым, если до удержания он был закрыт"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

function createDetailPayload(title, stepTitles) {
    return {
        slug: title,
        title,
        summary: "detail",
        difficulty: "beginner",
        tags: [],
        meta: {
            source: "mvp-fixture"
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "authored-fixture",
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
                status: "authored-fixture",
                branches: [],
                commits: [],
                files: [],
                annotations: []
            }
        }
    };
}

async function wait(windowLike, ms) {
    await new Promise((resolve) => windowLike.setTimeout(resolve, ms));
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

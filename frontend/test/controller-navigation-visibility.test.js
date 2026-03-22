import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { createBackendApiCatalogProvider } from "../src/catalog/catalog-provider.js";
import { createBackendApiDetailProvider } from "../src/detail/detail-provider.js";
import { createBackendApiProgressProvider } from "../src/progress/progress-provider.js";
import { createBackendApiSessionProvider } from "../src/session/session-provider.js";
import { createCatalogWorkspaceController } from "../src/workspace-shell/controller.js";

test("левая панель сохраняет фиксированную оболочку и скрывается по toggle", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");

    const fetchImpl = async (url) => {
        const requestUrl = new URL(url);

        if (requestUrl.pathname === "/api/scenarios") {
            return jsonResponse({
                items: [
                    {
                        id: "branch-safety",
                        slug: "branch-safety",
                        title: "Подтверди текущую ветку перед правками",
                        summary: "Сначала выясни, на какой ветке уже есть незавершённые изменения.",
                        difficulty: "beginner",
                        tags: ["branching", "navigation"]
                    }
                ],
                meta: {
                    source: "mvp-fixture",
                    query: {}
                }
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
            tagOptions: ["branching", "navigation"]
        });

        await controller.bootstrap();
        await flushAsyncWork();

        const layout = appRoot.querySelector(".lesson-layout");
        const navigationLane = appRoot.querySelector(".lesson-layout__lane--navigation");
        const visibilityToggle = appRoot.querySelector("[data-navigation-visibility-toggle]");
        const scenarioButtonBeforeCollapse = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');

        assert.ok(layout, "Workspace layout должен быть отрисован");
        assert.ok(navigationLane, "Левая lane должна существовать");
        assert.ok(visibilityToggle, "Кнопка скрытия панели должна существовать");
        assert.ok(scenarioButtonBeforeCollapse, "Сценарий должен быть доступен до скрытия панели");
        assert.equal(visibilityToggle.getAttribute("aria-expanded"), "true");
        assert.equal(layout.classList.contains("lesson-layout--navigation-collapsed"), false);

        visibilityToggle.click();
        await flushAsyncWork();

        const scenarioButtonAfterCollapse = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');

        assert.equal(
            scenarioButtonAfterCollapse,
            scenarioButtonBeforeCollapse,
            "Скрытие панели не должно пересоздавать навигационный DOM"
        );
        assert.equal(layout.classList.contains("lesson-layout--navigation-collapsed"), true);
        assert.equal(navigationLane.getAttribute("aria-hidden"), "true");
        assert.equal(visibilityToggle.getAttribute("aria-expanded"), "false");
        assert.match(visibilityToggle.getAttribute("aria-label") ?? "", /Показать левую панель/);

        visibilityToggle.click();
        await flushAsyncWork();

        assert.equal(layout.classList.contains("lesson-layout--navigation-collapsed"), false);
        assert.equal(navigationLane.hasAttribute("aria-hidden"), false);
        assert.equal(visibilityToggle.getAttribute("aria-expanded"), "true");
        assert.match(visibilityToggle.getAttribute("aria-label") ?? "", /Скрыть левую панель/);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

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
        HTMLButtonElement: windowLike.HTMLButtonElement,
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

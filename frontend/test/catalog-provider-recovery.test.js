import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { createCatalogWorkspaceController } from "../src/workspace-shell/controller.js";

test("сохраняет достижимый fallback flow после ошибки backend-api каталога", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");
    const catalogRequests = [];

    try {
        const controller = createCatalogWorkspaceController({
            appRoot,
            defaultProviderName: "backend-api",
            catalogProviderFactories: {
                "backend-api": () => ({
                    async browseCatalog() {
                        catalogRequests.push("backend-api");
                        throw new Error(
                            "Backend API недоступен для текущего способа открытия страницы. Запустите приложение через локальный сервер или переключитесь на local-fixture."
                        );
                    }
                }),
                "local-fixture": () => ({
                    async browseCatalog() {
                        catalogRequests.push("local-fixture");
                        return {
                            items: [
                                {
                                    slug: "branch-safety",
                                    title: "Branch safety",
                                    difficulty: "beginner",
                                    tags: ["branching"]
                                }
                            ],
                            meta: {
                                source: "local-fixture",
                                query: {
                                    difficulty: null,
                                    sort: null,
                                    tags: []
                                }
                            }
                        };
                    }
                }),
                "fixture-unavailable": () => ({
                    async browseCatalog() {
                        catalogRequests.push("fixture-unavailable");
                        throw new Error("Источник каталога сейчас недоступен. Повторите чуть позже.");
                    }
                })
            },
            detailProviderFactories: createSharedProviderFactories(),
            sessionProviderFactories: createSharedProviderFactories({
                startSession: async () => {
                    throw new Error("session should not start on catalog route");
                },
                submitAnswer: async () => {
                    throw new Error("submission should not run on catalog route");
                }
            }),
            progressProviderFactories: createSharedProviderFactories({
                loadProgressSummary: async () => ({
                    items: [],
                    recentActivity: [],
                    recommendations: null,
                    meta: {
                        source: "backend-api"
                    }
                })
            }),
            tagOptions: ["branching"]
        });

        await controller.bootstrap();
        await flushAsyncWork();

        const providerForm = appRoot.querySelector("[data-catalog-controls-form]");
        assert.ok(providerForm, "Каталог должен сохранять provider controls даже при ошибке backend-api");

        const providerSelect = providerForm.querySelector('select[name="providerName"]');
        assert.equal(providerSelect?.value, "backend-api");
        assert.match(appRoot.textContent, /Сервер \(основной путь\)/);
        assert.match(appRoot.textContent, /Локальные фикстуры \(диагностика\)/);
        assert.match(appRoot.textContent, /Недоступный источник \(fallback-проверка\)/);
        assert.match(appRoot.textContent, /селектор «Источник»/);
        assert.match(appRoot.textContent, /локальные фикстуры/i);
        assert.ok(!appRoot.textContent.includes("local-fixture"), "Recovery copy не должна показывать техническое имя provider");

        providerSelect.value = "local-fixture";
        providerSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        await flushAsyncWork();

        assert.deepEqual(catalogRequests, ["backend-api", "local-fixture"]);
        assert.ok(
            appRoot.querySelector('[data-scenario-toggle="branch-safety"]'),
            "После ручного переключения на fallback каталог должен снова становиться достижимым"
        );
        assert.match(appRoot.textContent, /Диагностический режим/);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

function createSharedProviderFactories(overrides = {}) {
    const createProvider = (providerName) => () => ({
        name: providerName,
        async loadScenarioDetail(slug = "unknown-scenario") {
            if (overrides.loadScenarioDetail) {
                return overrides.loadScenarioDetail(providerName, slug);
            }
            return {
                slug,
                title: slug,
                summary: "prefetched detail",
                difficulty: "beginner",
                tags: ["branching"],
                meta: {
                    source: providerName
                },
                workspace: {
                    shell: {
                        leftPanelTitle: "Карта сценария",
                        centerPanelTitle: "Урок",
                        rightPanelTitle: "Практика"
                    },
                    task: {
                        goal: "prefetched goal",
                        instructions: [],
                        steps: [],
                        annotations: []
                    },
                    repositoryContext: {
                        branches: [],
                        commits: [],
                        files: [],
                        annotations: []
                    }
                }
            };
        },
        async startSession() {
            if (overrides.startSession) {
                return overrides.startSession(providerName);
            }
            throw new Error("session should not start on catalog route");
        },
        async submitAnswer() {
            if (overrides.submitAnswer) {
                return overrides.submitAnswer(providerName);
            }
            throw new Error("submission should not run on catalog route");
        },
        async loadProgressSummary() {
            if (overrides.loadProgressSummary) {
                return overrides.loadProgressSummary(providerName);
            }
            throw new Error("progress should not load on catalog route");
        }
    });

    return {
        "backend-api": createProvider("backend-api"),
        "local-fixture": createProvider("local-fixture"),
        "fixture-unavailable": createProvider("fixture-unavailable")
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

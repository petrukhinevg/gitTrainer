import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { createBackendApiCatalogProvider } from "../src/catalog/catalog-provider.js";
import { createBackendApiDetailProvider } from "../src/detail/detail-provider.js";
import { createBackendApiProgressProvider } from "../src/progress/progress-provider.js";
import { createBackendApiSessionProvider } from "../src/session/session-provider.js";
import { createCatalogWorkspaceController } from "../src/workspace-shell/controller.js";

test("проходит backend-api smoke path catalog -> exercise -> submit -> progress", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");
    const requests = [];

    let progressPayload = createInitialProgressPayload();
    const fetchImpl = async (url, options = {}) => {
        const requestUrl = new URL(url);
        const method = String(options.method ?? "GET").toUpperCase();
        requests.push(`${method} ${requestUrl.pathname}`);

        if (method === "GET" && requestUrl.pathname === "/api/scenarios") {
            return jsonResponse(createCatalogPayload());
        }

        if (method === "GET" && requestUrl.pathname === "/api/scenarios/branch-safety") {
            return jsonResponse(createBranchSafetyDetailPayload());
        }

        if (method === "POST" && requestUrl.pathname === "/api/sessions") {
            const payload = JSON.parse(String(options.body ?? "{}"));
            assert.deepEqual(payload, {
                scenarioSlug: "branch-safety",
                source: null
            });
            return jsonResponse(createStartSessionPayload());
        }

        if (method === "POST" && requestUrl.pathname === "/api/sessions/session-1/submissions") {
            const payload = JSON.parse(String(options.body ?? "{}"));
            assert.deepEqual(payload, {
                answerType: "command_text",
                answer: "git branch --show-current"
            });
            progressPayload = createCompletedProgressPayload();
            return jsonResponse(createSubmissionPayload());
        }

        if (method === "GET" && requestUrl.pathname === "/api/progress") {
            return jsonResponse(progressPayload);
        }

        throw new Error(`Unexpected request: ${method} ${requestUrl.pathname}`);
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
            tagOptions: ["basics", "branching", "navigation", "planning", "remote"]
        });

        await controller.bootstrap();
        await flushAsyncWork();

        assert.ok(
            appRoot.querySelector('[data-scenario-toggle="branch-safety"]'),
            "Каталог должен отрисовать сценарий branch-safety"
        );
        assert.match(appRoot.textContent, /Backend API остаётся основным пользовательским путём/);

        await navigateToHash(dom.window, "#/exercise/branch-safety");
        await flushAsyncWork();

        assert.ok(
            appRoot.querySelector('[data-repository-branch-graph="ready"]'),
            "Экран упражнения должен показать branch graph"
        );
        assert.match(appRoot.textContent, /Подтверди текущую ветку перед правками/);

        const answerField = appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]');
        assert.ok(answerField, "Поле ввода ответа должно быть доступно");
        answerField.value = "git branch --show-current";
        answerField.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        await flushAsyncWork();

        const submissionForm = appRoot.querySelector("[data-submission-draft-form]");
        assert.ok(submissionForm, "Форма отправки должна быть доступна");
        submissionForm.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        await flushAsyncWork();

        const retryFeedback = appRoot.querySelector('[data-retry-feedback-panel][data-retry-feedback-status="resolved"]');
        assert.ok(retryFeedback, "После успешной отправки должен появиться resolved retry feedback");
        assert.equal(
            appRoot.querySelector('[data-retry-state-status="complete"]')?.getAttribute("data-retry-state-status"),
            "complete"
        );
        assert.match(appRoot.textContent, /Повторное объяснение не требуется/);

        await navigateToHash(dom.window, "#/progress");
        await flushAsyncWork();

        assert.ok(
            appRoot.querySelector('[data-progress-status-marker="completed"]'),
            "Экран прогресса должен показывать completed marker"
        );
        assert.match(appRoot.textContent, /Подтверди текущую ветку перед правками/);
        assert.match(appRoot.textContent, /Рекомендация/iu);

        assert.deepEqual(requests.slice(0, 5), [
            "GET /api/scenarios",
            "GET /api/scenarios/branch-safety",
            "GET /api/scenarios/remote-sync-preview",
            "POST /api/sessions",
            "POST /api/sessions/session-1/submissions"
        ]);
        assert.ok(requests.length >= 6, "После перехода на progress должен быть хотя бы один запрос сводки прогресса");
        assert.ok(
            requests.slice(5).every((request) => request === "GET /api/progress"),
            "После submit дополнительные сетевые запросы должны ограничиваться только progress summary"
        );
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
                summary: "Сначала выясни, на какой ветке уже есть незавершённые изменения, и только потом решай, допустимо ли переключение.",
                difficulty: "beginner",
                tags: ["branching", "navigation", "basics"]
            },
            {
                id: "remote-sync-preview",
                slug: "remote-sync-preview",
                title: "Сначала обнови удалённое состояние",
                summary: "Подтверди, что локальные данные об origin/main могли устареть, и начни с fetch, а не с немедленного pull.",
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
    return {
        id: "branch-safety",
        slug: "branch-safety",
        title: "Подтверди текущую ветку перед правками",
        summary: "Сначала выясни, на какой ветке уже есть незавершённые изменения, и только потом решай, допустимо ли переключение.",
        difficulty: "beginner",
        tags: ["branching", "navigation", "basics"],
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
                goal: "Сначала подтвердите активную ветку и признаки незавершённой hotfix-работы, а уже потом решайте, допустимо ли переключение.",
                instructions: [
                    {
                        id: "confirm-active-branch-before-switching",
                        text: "Сначала подтвердите активную ветку командой чтения, а не пытайтесь сразу выполнить checkout."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Подтвердите текущую ветку",
                        detail: "Начните с команды чтения branch-контекста, чтобы точно увидеть, где уже открыта работа."
                    }
                ],
                annotations: [
                    {
                        label: "Что считается безопасным шагом",
                        message: "Пока в hotfix-ветке уже есть незавершённые изменения, сценарий оценивает команду чтения branch-контекста."
                    }
                ]
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "release/hotfix-7", current: true },
                    { name: "feature/menu-refresh", current: false },
                    { name: "main", current: false }
                ],
                commits: [
                    { id: "b74e2d0", summary: "hotfix: восстановить отступы заголовка" }
                ],
                files: [
                    { path: "src/ui/header.css", status: "modified" },
                    { path: "docs/release-checklist.md", status: "modified" }
                ],
                annotations: [
                    {
                        label: "Сигнал активной ветки",
                        message: "Сейчас активна release/hotfix-7, и оба изменённых файла выглядят как незавершённая hotfix или release-работа."
                    }
                ]
            }
        }
    };
}

function createStartSessionPayload() {
    return {
        sessionId: "session-1",
        scenario: {
            slug: "branch-safety",
            title: "Подтверди текущую ветку перед правками",
            source: "mvp-fixture"
        },
        lifecycle: {
            status: "active",
            startedAt: "2026-03-21T00:23:59.526366Z",
            submissionCount: 0,
            lastSubmissionId: null
        },
        submission: {
            supportedAnswerTypes: ["command_text"],
            placeholderOutcome: {
                status: "placeholder",
                correctness: "not-evaluated",
                code: "awaiting-first-submission",
                message: "Транспорт сессии готов. Отправьте первый ответ, чтобы сразу получить результат проверки."
            },
            placeholderRetryFeedback: {
                status: "placeholder",
                retryState: {
                    status: "idle",
                    attemptNumber: 0,
                    eligibility: "not-needed"
                },
                explanation: {
                    status: "placeholder",
                    title: "Подсказка для повтора",
                    tone: "neutral",
                    message: "Подсказка для повтора появится здесь после первой проверенной отправки.",
                    details: []
                },
                hint: {
                    status: "placeholder",
                    level: "baseline",
                    message: "Прогресс подсказок остаётся в ожидании, пока пользователь не получит проверенную обратную связь.",
                    reveals: []
                }
            }
        }
    };
}

function createSubmissionPayload() {
    return {
        submissionId: "submission-1",
        sessionId: "session-1",
        attemptNumber: 1,
        submittedAt: "2026-03-21T00:24:05.818771Z",
        lifecycle: {
            status: "active",
            startedAt: "2026-03-21T00:23:59.526366Z",
            submissionCount: 1,
            lastSubmissionId: "submission-1"
        },
        answer: {
            type: "command_text",
            value: "git branch --show-current"
        },
        outcome: {
            status: "evaluated",
            correctness: "correct",
            code: "expected-command",
            message: "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
        },
        retryFeedback: {
            status: "resolved",
            retryState: {
                status: "complete",
                attemptNumber: 1,
                eligibility: "not-needed"
            },
            explanation: {
                status: "resolved",
                title: "Повторное объяснение не требуется",
                tone: "success",
                message: "Эта попытка уже привела к безопасному следующему шагу, поэтому панель повтора остаётся спокойной.",
                details: []
            },
            hint: {
                status: "resolved",
                level: "none",
                message: "После правильного ответа дополнительная подсказка не нужна.",
                reveals: []
            }
        }
    };
}

function createInitialProgressPayload() {
    return {
        items: [
            {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Подтверди текущую ветку перед правками",
                status: "in_progress",
                attemptCount: 0,
                completionCount: 0,
                lastActivityAt: "2026-03-21T00:23:59.526366Z"
            }
        ],
        recentActivity: [
            {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Подтверди текущую ветку перед правками",
                status: "in_progress",
                eventType: "started",
                happenedAt: "2026-03-21T00:23:59.526366Z"
            }
        ],
        recommendations: {
            solved: [],
            attempted: [
                {
                    scenarioSlug: "branch-safety",
                    scenarioTitle: "Подтверди текущую ветку перед правками"
                }
            ],
            next: {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Подтверди текущую ветку перед правками"
            },
            rationale: "Продолжайте сценарий, который уже начали, чтобы не терять контекст."
        },
        meta: {
            source: "mvp-fixture"
        }
    };
}

function createCompletedProgressPayload() {
    return {
        items: [
            {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Подтверди текущую ветку перед правками",
                status: "completed",
                attemptCount: 1,
                completionCount: 1,
                lastActivityAt: "2026-03-21T00:24:05.818771Z"
            }
        ],
        recentActivity: [
            {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Подтверди текущую ветку перед правками",
                status: "completed",
                eventType: "completed",
                happenedAt: "2026-03-21T00:24:05.818771Z"
            }
        ],
        recommendations: {
            solved: [
                {
                    scenarioSlug: "branch-safety",
                    scenarioTitle: "Подтверди текущую ветку перед правками"
                }
            ],
            attempted: [],
            next: {
                scenarioSlug: "remote-sync-preview",
                scenarioTitle: "Сначала обнови удалённое состояние"
            },
            rationale: "Продолжайте сценарий, который уже начали, чтобы не терять контекст."
        },
        meta: {
            source: "mvp-fixture"
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

async function navigateToHash(windowLike, nextHash) {
    windowLike.location.hash = nextHash;
    windowLike.dispatchEvent(new windowLike.HashChangeEvent("hashchange"));
    await flushAsyncWork();
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

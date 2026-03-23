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

        assert.deepEqual(requests.slice(0, 3), [
            "GET /api/scenarios",
            "GET /api/scenarios/branch-safety",
            "GET /api/scenarios/remote-sync-preview"
        ]);
        assert.ok(
            requests.includes("POST /api/sessions"),
            "Smoke path должен запускать backend session"
        );
        assert.ok(
            requests.includes("POST /api/sessions/session-1/submissions"),
            "Smoke path должен отправлять ответ в активную сессию"
        );
        assert.ok(requests.length >= 6, "После перехода на progress должен быть хотя бы один запрос сводки прогресса");
        const requestIndexAfterSubmission = requests.lastIndexOf("POST /api/sessions/session-1/submissions");
        assert.ok(requestIndexAfterSubmission >= 0, "Submit request должен попасть в журнал запросов");
        assert.ok(
            requests.slice(requestIndexAfterSubmission + 1).every((request) => request === "GET /api/progress"),
            "После submit дополнительные сетевые запросы должны ограничиваться только progress summary"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("отправляет ответ по Enter в поле команды", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");
    const requests = [];

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
            return jsonResponse(createStartSessionPayload());
        }

        if (method === "POST" && requestUrl.pathname === "/api/sessions/session-1/submissions") {
            const payload = JSON.parse(String(options.body ?? "{}"));
            assert.deepEqual(payload, {
                answerType: "command_text",
                answer: "git branch --show-current"
            });
            return jsonResponse(createSubmissionPayload());
        }

        if (method === "GET" && requestUrl.pathname === "/api/progress") {
            return jsonResponse(createInitialProgressPayload());
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
        await navigateToHash(dom.window, "#/exercise/branch-safety");
        await flushAsyncWork();

        const answerField = appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]');
        assert.ok(answerField, "Поле ввода ответа должно быть доступно");
        answerField.value = "git branch --show-current";
        answerField.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        await flushAsyncWork();

        const currentAnswerField = appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]');
        currentAnswerField.dispatchEvent(new dom.window.KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true
        }));
        await flushAsyncWork();

        assert.ok(
            requests.includes("POST /api/sessions/session-1/submissions"),
            "Нажатие Enter должно запускать отправку ответа"
        );
        assert.ok(
            appRoot.querySelector('[data-retry-feedback-panel][data-retry-feedback-status="resolved"]'),
            "После Enter-submit должен появиться resolved retry feedback"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("правая колонка переключается на live workspace state из session API", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");

    const fetchImpl = async (url, options = {}) => {
        const requestUrl = new URL(url);
        const method = String(options.method ?? "GET").toUpperCase();

        if (method === "GET" && requestUrl.pathname === "/api/scenarios") {
            return jsonResponse(createCatalogPayload());
        }

        if (method === "GET" && requestUrl.pathname === "/api/scenarios/stash-checkpoint-draft") {
            return jsonResponse(createStashDetailPayload());
        }

        if (method === "POST" && requestUrl.pathname === "/api/sessions") {
            return jsonResponse(createStashStartSessionPayload());
        }

        if (method === "POST" && requestUrl.pathname === "/api/sessions/session-stash/submissions") {
            return jsonResponse(createStashSubmissionPayload());
        }

        if (method === "GET" && requestUrl.pathname === "/api/progress") {
            return jsonResponse(createInitialProgressPayload());
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
            tagOptions: ["basics", "branching", "navigation", "planning", "remote", "stash"]
        });

        await controller.bootstrap();
        await flushAsyncWork();
        await navigateToHash(dom.window, "#/exercise/stash-checkpoint-draft");
        await flushAsyncWork();

        assert.match(appRoot.textContent, /живая сессия/i);
        assert.match(appRoot.textContent, /Файлы: 2/);
        assert.match(appRoot.textContent, /feature\/test-stash-panel/);

        const answerField = appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]');
        assert.ok(answerField, "Поле ввода stash-команды должно быть доступно");
        answerField.value = "git stash push -u";
        answerField.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        await flushAsyncWork();

        appRoot.querySelector("[data-submission-draft-form]")
            .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        await flushAsyncWork();

        assert.match(appRoot.textContent, /Файлы: 0/);
        assert.match(appRoot.textContent, /В stash сохранено записей: 1\./);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("перетаскивание маркера навигации открывает соответствующий сценарий в центре", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");
    setReducedMotion(dom.window, true);

    const fetchImpl = async (url, options = {}) => {
        const requestUrl = new URL(url);
        const method = String(options.method ?? "GET").toUpperCase();

        if (method === "GET" && requestUrl.pathname === "/api/scenarios") {
            return jsonResponse(createCatalogPayload());
        }

        if (method === "GET" && requestUrl.pathname === "/api/scenarios/branch-safety") {
            return jsonResponse(createBranchSafetyDetailPayload());
        }

        if (method === "GET" && requestUrl.pathname === "/api/scenarios/remote-sync-preview") {
            return jsonResponse(createRemoteSyncDetailPayload());
        }

        if (method === "POST" && requestUrl.pathname === "/api/sessions") {
            const payload = JSON.parse(String(options.body ?? "{}"));
            return jsonResponse(createStartSessionPayload(payload.scenarioSlug));
        }

        if (method === "GET" && requestUrl.pathname === "/api/progress") {
            return jsonResponse(createInitialProgressPayload());
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
        await navigateToHash(dom.window, "#/exercise/branch-safety");
        await flushAsyncWork();

        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const marker = appRoot.querySelector("[data-navigation-active-marker]");
        const branchScenarioToggle = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const remoteScenarioToggle = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');
        const branchPanel = appRoot.querySelector('[data-scenario-panel="branch-safety"]');

        assert.ok(
            navigationLane && marker && branchScenarioToggle && remoteScenarioToggle && branchPanel,
            "Навигационные элементы должны быть доступны"
        );

        assignRect(branchScenarioToggle, createRect(24, 120, 220, 52));
        assignRect(remoteScenarioToggle, createRect(24, 320, 220, 52));

        marker.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientY: 250
        }));
        dom.window.dispatchEvent(new dom.window.MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            buttons: 1,
            clientY: 346
        }));
        await flushAsyncWork();

        assert.equal(dom.window.location.hash, "#/exercise/branch-safety");
        assert.equal(navigationLane.dataset.markerDragging, "true");
        assert.equal(remoteScenarioToggle.dataset.navigationMarkerPreviewTarget, "true");
        assert.equal(branchPanel.isConnected, true);

        dom.window.dispatchEvent(new dom.window.MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientY: 346
        }));
        await flushAsyncWork();

        assert.equal(dom.window.location.hash, "#/exercise/remote-sync-preview");
        assert.match(appRoot.textContent, /Сначала обнови удалённое состояние/);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("во время drag скрываются дочерние панели и preview пропадает после фиксации выбора", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");
    setReducedMotion(dom.window, true);

    const fetchImpl = async (url, options = {}) => {
        const requestUrl = new URL(url);
        const method = String(options.method ?? "GET").toUpperCase();

        if (method === "GET" && requestUrl.pathname === "/api/scenarios") {
            return jsonResponse(createCatalogPayload());
        }

        if (method === "GET" && requestUrl.pathname === "/api/scenarios/branch-safety") {
            return jsonResponse(createBranchSafetyDetailPayload());
        }

        if (method === "GET" && requestUrl.pathname === "/api/scenarios/remote-sync-preview") {
            return jsonResponse(createRemoteSyncDetailPayload());
        }

        if (method === "POST" && requestUrl.pathname === "/api/sessions") {
            const payload = JSON.parse(String(options.body ?? "{}"));
            return jsonResponse(createStartSessionPayload(payload.scenarioSlug));
        }

        if (method === "GET" && requestUrl.pathname === "/api/progress") {
            return jsonResponse(createInitialProgressPayload());
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
        await navigateToHash(dom.window, "#/exercise/branch-safety");
        await flushAsyncWork();

        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const marker = appRoot.querySelector("[data-navigation-active-marker]");
        const branchScenarioToggle = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const remoteScenarioToggle = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');
        const branchPanel = appRoot.querySelector('[data-scenario-panel="branch-safety"]');

        assert.ok(navigationLane && marker && branchScenarioToggle && remoteScenarioToggle && branchPanel);

        assignRect(branchScenarioToggle, createRect(24, 120, 220, 52));
        assignRect(remoteScenarioToggle, createRect(24, 320, 220, 52));

        marker.dispatchEvent(new dom.window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientY: 250
        }));
        dom.window.dispatchEvent(new dom.window.MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            buttons: 1,
            clientY: 346
        }));
        await flushAsyncWork();

        assert.equal(navigationLane.dataset.markerDragging, "true");
        assert.equal(branchPanel.closest("[data-scenario-panel]")?.hasAttribute("hidden"), false);
        assert.equal(remoteScenarioToggle.dataset.navigationMarkerPreviewTarget, "true");
        assert.ok(marker.classList.contains("navigation-flow-rail__marker--dragging"));

        dom.window.dispatchEvent(new dom.window.MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientY: 346
        }));
        await flushAsyncWork();

        assert.equal(dom.window.location.hash, "#/exercise/remote-sync-preview");
        assert.equal(
            appRoot.querySelector("[data-navigation-active-marker]").classList.contains("navigation-flow-rail__marker--dragging"),
            false
        );
        assert.equal(navigationLane.hasAttribute("data-marker-dragging"), false);
        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]')
                ?.hasAttribute("data-navigation-marker-preview-target"),
            false
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
            },
            {
                id: "stash-checkpoint-draft",
                slug: "stash-checkpoint-draft",
                title: "Убери черновик в stash",
                summary: "Сначала зафиксируй текущий рабочий контекст, а затем убери изменения и untracked файлы в stash.",
                difficulty: "intermediate",
                tags: ["stash", "safety", "workspace"]
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

function createRemoteSyncDetailPayload() {
    return {
        id: "remote-sync-preview",
        slug: "remote-sync-preview",
        title: "Сначала обнови удалённое состояние",
        summary: "Подтверди, что локальные данные об origin/main могли устареть, и начни с fetch, а не с немедленного pull.",
        difficulty: "intermediate",
        tags: ["remote", "planning"],
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
                goal: "Сначала подтверди актуальность удалённых ссылок, а не запускай синхронизацию вслепую.",
                instructions: [
                    {
                        id: "refresh-remote-first",
                        text: "Начните с безопасной проверки удалённого состояния."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Освежите удалённые ссылки",
                        detail: "Перед анализом расхождений нужно обновить локальные ссылки на origin."
                    }
                ],
                annotations: []
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "main", current: true }
                ],
                commits: [],
                files: [],
                annotations: []
            }
        }
    };
}

function createStashDetailPayload() {
    return {
        id: "stash-checkpoint-draft",
        slug: "stash-checkpoint-draft",
        title: "Убери черновик в stash",
        summary: "Сначала зафиксируй текущий рабочий контекст, а затем убери изменения и untracked файлы в stash.",
        difficulty: "intermediate",
        tags: ["stash", "safety", "workspace"],
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
                goal: "Подтвердите текущие изменения и безопасно уберите их в stash вместе с untracked файлами.",
                instructions: [
                    {
                        id: "inspect-before-stash",
                        text: "Сначала посмотрите на текущее состояние, затем сохраните весь черновик в stash."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Просмотрите рабочее дерево",
                        detail: "Подтвердите, какие файлы изменены и какие ещё не отслеживаются."
                    }
                ],
                annotations: []
            },
            repositoryContext: {
                status: "authored-fixture",
                branches: [
                    { name: "feature/test-stash-panel", current: true }
                ],
                commits: [
                    { id: "c41ab00", summary: "ui: подготовить черновик stash-панели" }
                ],
                files: [
                    { path: "frontend/src/demo-panel.js", status: "modified" },
                    { path: "notes/ui-placeholder.txt", status: "untracked" }
                ],
                annotations: []
            }
        }
    };
}

function createStartSessionPayload(scenarioSlug = "branch-safety") {
    return {
        sessionId: "session-1",
        scenario: {
            slug: scenarioSlug,
            title: scenarioSlug === "remote-sync-preview"
                ? "Сначала обнови удалённое состояние"
                : scenarioSlug === "stash-checkpoint-draft"
                    ? "Убери черновик в stash"
                : "Подтверди текущую ветку перед правками",
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
        },
        workspace: {
            repositoryContext: resolveStartRepositoryContext(scenarioSlug)
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
        },
        workspace: {
            repositoryContext: {
                status: "live-session",
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
                        label: "Активная ветка",
                        message: "Сессия сейчас открыта на `release/hotfix-7`."
                    }
                ]
            }
        }
    };
}

function createStashStartSessionPayload() {
    return {
        ...createStartSessionPayload("stash-checkpoint-draft"),
        sessionId: "session-stash"
    };
}

function createStashSubmissionPayload() {
    return {
        submissionId: "submission-stash-1",
        sessionId: "session-stash",
        attemptNumber: 1,
        submittedAt: "2026-03-21T00:24:05.818771Z",
        lifecycle: {
            status: "active",
            startedAt: "2026-03-21T00:23:59.526366Z",
            submissionCount: 1,
            lastSubmissionId: "submission-stash-1"
        },
        answer: {
            type: "command_text",
            value: "git stash push -u"
        },
        outcome: {
            status: "evaluated",
            correctness: "correct",
            code: "expected-command",
            message: "Изменения и untracked-файлы безопасно убраны в stash."
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
                message: "Рабочее дерево уже приведено в нужное состояние.",
                details: []
            },
            hint: {
                status: "resolved",
                level: "none",
                message: "После правильного ответа дополнительная подсказка не нужна.",
                reveals: []
            }
        },
        workspace: {
            repositoryContext: {
                status: "live-session",
                branches: [
                    { name: "feature/test-stash-panel", current: true },
                    { name: "main", current: false }
                ],
                commits: [
                    { id: "c41ab00", summary: "ui: подготовить черновик stash-панели" }
                ],
                files: [],
                annotations: [
                    {
                        label: "Активная ветка",
                        message: "Сессия сейчас открыта на `feature/test-stash-panel`."
                    },
                    {
                        label: "Рабочее дерево",
                        message: "Незакоммиченных изменений сейчас нет."
                    },
                    {
                        label: "Stash",
                        message: "В stash сохранено записей: 1."
                    }
                ]
            }
        }
    };
}

function resolveStartRepositoryContext(scenarioSlug) {
    if (scenarioSlug === "stash-checkpoint-draft") {
        return {
            status: "live-session",
            branches: [
                { name: "feature/test-stash-panel", current: true },
                { name: "main", current: false }
            ],
            commits: [
                { id: "c41ab00", summary: "ui: подготовить черновик stash-панели" }
            ],
            files: [
                { path: "frontend/src/demo-panel.js", status: "modified" },
                { path: "notes/ui-placeholder.txt", status: "untracked" }
            ],
            annotations: [
                {
                    label: "Активная ветка",
                    message: "Сессия сейчас открыта на `feature/test-stash-panel`."
                }
            ]
        };
    }

    return {
        status: "live-session",
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
                label: "Активная ветка",
                message: "Сессия сейчас открыта на `release/hotfix-7`."
            }
        ]
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

function assignRect(element, rect) {
    Object.defineProperty(element, "getBoundingClientRect", {
        configurable: true,
        value: () => rect
    });
}

function createRect(left, top, width, height) {
    return {
        x: left,
        y: top,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height
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

function setReducedMotion(windowLike, matches) {
    windowLike.matchMedia = () => ({
        matches,
        media: matches ? "(prefers-reduced-motion: reduce)" : "(prefers-reduced-motion: no-preference)",
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
    });
}

import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { createBackendApiCatalogProvider } from "../src/catalog/catalog-provider.js";
import { createBackendApiDetailProvider } from "../src/detail/detail-provider.js";
import { createBackendApiProgressProvider } from "../src/progress/progress-provider.js";
import { createBackendApiSessionProvider } from "../src/session/session-provider.js";
import { createCatalogWorkspaceController } from "../src/workspace-shell/controller.js";

test("маршрут #/sandbox открывает рабочую песочницу через существующий сценарий", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/sandbox"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");

    try {
        const controller = createCatalogWorkspaceController({
            appRoot,
            defaultProviderName: "backend-api",
            catalogProviderFactories: {
                "backend-api": () => createSandboxCatalogProvider()
            },
            detailProviderFactories: {
                "backend-api": () => createSandboxDetailProvider()
            },
            sessionProviderFactories: {
                "backend-api": () => createSandboxSessionProvider()
            },
            progressProviderFactories: {
                "backend-api": () => createSandboxProgressProvider()
            },
            tagOptions: ["branching", "history", "planning", "navigation", "remote"]
        });

        await controller.bootstrap();
        await flushAsyncWork();

        assert.match(appRoot.textContent, /Сравни diff перед попыткой merge/);
        assert.ok(
            appRoot.querySelector('[data-submission-draft-form]'),
            "Песочница должна открывать рабочую форму отправки, а не пустую заглушку"
        );
        assert.ok(
            appRoot.querySelector('[href="#/sandbox"].flow-block--active'),
            "Shortcut песочницы должен оставаться активным"
        );
        assert.equal(
            appRoot.querySelector(".workspace-terminal__meta"),
            null,
            "Терминал больше не должен показывать meta-блок над полем ввода"
        );
        assert.equal(
            appRoot.querySelector('[data-scenario-toggle="merge-sandbox-outline"]'),
            null,
            "Служебный sandbox-сценарий не должен дублироваться в общем списке заданий"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

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
        assert.match(appRoot.textContent, /Каталог и практика работают через backend API/);

        await navigateToHash(dom.window, "#/exercise/branch-safety");
        await flushAsyncWork();

        assert.ok(
            appRoot.querySelector('[data-repository-workspace-visual="ready"]'),
            "Экран упражнения должен показать визуальную workspace-схему"
        );
        assert.ok(
            appRoot.querySelector('[data-repository-commit-tree]'),
            "Viewer должен построить commit tree"
        );
        assert.equal(
            appRoot.querySelector('.practice-pane--viewer .workspace-card__header'),
            null,
            "Верхняя часть viewer не должна показывать отдельную карточку-обвязку"
        );
        assert.match(
            appRoot.querySelector("[data-workspace-terminal-header]")?.textContent ?? "",
            /Git Terminal - Подтверди ветку и незавершённый hotfix/,
            "Терминал должен показывать заголовок с названием текущего задания"
        );
        assert.equal(
            appRoot.querySelector('.workspace-terminal__chrome'),
            null,
            "Терминал не должен показывать декоративную chrome-шапку"
        );
        assert.doesNotMatch(
            appRoot.textContent ?? "",
            /Workspace activity|Git workspace/,
            "Нижняя часть practice panel не должна показывать удалённые секции"
        );
        const commitTree = appRoot.querySelector('[data-repository-commit-tree]');
        const commandHistory = appRoot.querySelector('[data-workspace-command-history]');
        assert.ok(commandHistory, "Под commit tree должна появиться terminal history");
        assert.ok(
            Boolean(commitTree?.compareDocumentPosition(commandHistory) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING),
            "Commit tree должен располагаться выше terminal history"
        );
        const terminalEditor = appRoot.querySelector(".workspace-terminal__editor");
        assert.equal(
            appRoot.querySelector(".workspace-terminal__meta"),
            null,
            "Над полем ввода не должно оставаться отдельного meta-блока"
        );
        assert.ok(terminalEditor, "Строка ввода команды должна оставаться доступной");
        assert.equal(
            appRoot.querySelector('[data-workspace-console-state]')?.getAttribute("data-workspace-console-state"),
            "ready"
        );
        assert.equal(
            appRoot.querySelectorAll("[data-workspace-terminal-output]").length,
            0,
            "В terminal history не должно оставаться сервисных output-сообщений"
        );
        assert.match(appRoot.textContent, /Подтверди ветку и незавершённый hotfix/);

        const answerField = appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]');
        assert.ok(answerField, "Поле ввода ответа должно быть доступно");
        installTerminalHistoryMetrics(dom.window);
        const commitTreeNodeBeforeTyping = appRoot.querySelector('[data-repository-commit-tree]');
        assert.ok(commitTreeNodeBeforeTyping, "Commit tree должен быть доступен до ввода команды");
        answerField.value = "git branch --show-current";
        answerField.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        await flushAsyncWork();
        assert.equal(
            appRoot.querySelector('[data-repository-commit-tree]'),
            commitTreeNodeBeforeTyping,
            "Commit tree не должен пересоздаваться на каждый ввод в поле команды"
        );

        const submissionForm = appRoot.querySelector("[data-submission-draft-form]");
        assert.ok(submissionForm, "Форма отправки должна быть доступна");
        submissionForm.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        assert.equal(
            appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]')?.value,
            "",
            "Поле команды должно очищаться сразу при submit, не дожидаясь ответа"
        );
        await flushAsyncWork();

        assert.equal(
            appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]')?.value,
            "",
            "После отправки поле команды должно очищаться"
        );
        assert.equal(
            dom.window.document.activeElement,
            appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]'),
            "После отправки фокус должен возвращаться в поле команды"
        );
        assert.equal(
            appRoot.querySelector(".workspace-terminal__history")?.scrollTop,
            240,
            "После отправки terminal history должна прокручиваться к последней команде и ответу"
        );

        const retryFeedback = appRoot.querySelector('[data-retry-feedback-panel][data-retry-feedback-status="resolved"]');
        assert.ok(retryFeedback, "После успешной отправки должен появиться resolved retry feedback");
        assert.equal(
            appRoot.querySelector('[data-retry-state-status="complete"]')?.getAttribute("data-retry-state-status"),
            "complete"
        );
        assert.match(appRoot.textContent, /Повторное объяснение не требуется/);
        assert.doesNotMatch(
            appRoot.textContent ?? "",
            /Команда git branch --show-current выполнена\. Viewer показывает обновлённый snapshot workspace\./,
            "Служебный summary про обновлённый snapshot не должен показываться под командой"
        );

        await navigateToHash(dom.window, "#/progress");
        await flushAsyncWork();

        assert.ok(
            appRoot.querySelector('[data-progress-status-marker="completed"]'),
            "Экран прогресса должен показывать completed marker"
        );
        assert.match(appRoot.textContent, /Подтверди ветку и незавершённый hotfix/);
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
        assert.ok(
            appRoot.querySelector('[data-workspace-command-history] [data-workspace-command-status="correct"]'),
            "После Enter-submit history должна пометить команду как correct"
        );
        assert.equal(
            appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]')?.value,
            "",
            "После Enter-submit поле команды тоже должно очищаться"
        );
        assert.equal(
            dom.window.document.activeElement,
            appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]'),
            "После Enter-submit фокус должен оставаться в поле команды"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("терминал не дублирует backend-ошибку в summary и stderr", async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=\"app\"></div></body></html>", {
        url: "http://localhost:5173/#/catalog"
    });
    const restoreGlobals = installDomGlobals(dom.window);
    const appRoot = dom.window.document.querySelector("#app");
    const duplicatedMessage = "Используйте простую Git-команду без shell-кавычек и подстановок.";

    const fetchImpl = async (url, options = {}) => {
        const requestUrl = new URL(url);
        const method = String(options.method ?? "GET").toUpperCase();

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
            return jsonResponse({
                type: "https://git-trainer.dev/problems/validation",
                title: "Validation failed",
                status: 400,
                detail: duplicatedMessage,
                code: "validation-runner-quoted-args-not-supported",
                failureDisposition: "terminal",
                retryable: false
            }, { status: 400 });
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
        assert.ok(answerField, "Поле ввода должно быть доступно");
        answerField.value = "git commit --allow-empty -m \"feat: branch commit\"";
        answerField.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        await flushAsyncWork();

        appRoot.querySelector("[data-submission-draft-form]")
            .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        await flushAsyncWork();

        const occurrences = (appRoot.textContent?.match(new RegExp(escapeRegExp(duplicatedMessage), "g")) ?? []).length;
        assert.equal(occurrences, 1, "Одна и та же backend-ошибка не должна рендериться дважды");
        assert.equal(
            appRoot.querySelectorAll(".workspace-terminal__summary--error").length,
            0,
            "Если summary совпадает с stderr, отдельную summary-строку показывать не нужно"
        );
        assert.match(appRoot.textContent ?? "", /Подробности ошибки уже показаны в консоли выше\./);
        assert.doesNotMatch(
            appRoot.textContent ?? "",
            /UI не получил корректный результат команды/,
            "Сервисный terminal-error status-copy не должен дублироваться в transcript"
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

        assert.equal(
            appRoot.querySelector(".workspace-terminal__meta"),
            null,
            "Терминал live session тоже не должен показывать meta-блок над полем ввода"
        );
        assert.match(appRoot.textContent, /Файлы: 2/);
        assert.match(appRoot.textContent, /feature\/test-stash-panel/);
        assert.ok(
            appRoot.querySelector('[data-repository-commit-tree]'),
            "Viewer должен сохранить commit tree в верхней части панели"
        );
        assert.ok(
            appRoot.querySelector('[data-workspace-command-history]'),
            "Viewer должен показать terminal history под деревом"
        );
        assert.equal(
            appRoot.querySelector('.workspace-terminal__chrome'),
            null,
            "Терминал в viewer должен оставаться без декоративной chrome-шапки"
        );
        assert.doesNotMatch(
            appRoot.textContent ?? "",
            /Workspace activity|Git workspace/,
            "Нижняя часть practice panel не должна показывать удалённые секции"
        );

        const answerField = appRoot.querySelector('[data-submission-draft-form] textarea[name="answer"]');
        assert.ok(answerField, "Поле ввода stash-команды должно быть доступно");
        answerField.value = "git stash push -u";
        answerField.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        await flushAsyncWork();

        appRoot.querySelector("[data-submission-draft-form]")
            .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        await flushAsyncWork();

        assert.match(appRoot.textContent, /Файлы: 0/);
        assert.equal(
            appRoot.querySelector('[data-workspace-console-state]')?.getAttribute("data-workspace-console-state"),
            "updated"
        );
        assert.ok(
            appRoot.querySelector('[data-workspace-command-history] [data-workspace-command-status="correct"]'),
            "После stash history должна показать успешную команду"
        );
        assert.equal(
            appRoot.querySelectorAll("[data-workspace-terminal-output]").length,
            0,
            "Даже в live-session terminal history должна содержать только команды и их ответы"
        );
        assert.match(appRoot.textContent, /git stash push -u/);
        assert.match(appRoot.textContent, /Изменения и untracked-файлы безопасно убраны в stash/);
        assert.doesNotMatch(
            appRoot.textContent ?? "",
            /Команда принята, и viewer уже показывает обновлённый snapshot рабочей копии/,
            "Служебный updated-status не должен дублироваться в terminal transcript"
        );
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
        assert.ok(
            (appRoot.textContent ?? "").includes("Сначала обнови `origin/main` перед интеграцией")
        );
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
                title: "Подтверди ветку и незавершённый hotfix",
                summary: "Сначала выясни, на какой ветке уже есть незавершённые изменения, и только потом решай, допустимо ли переключение.",
                difficulty: "beginner",
                tags: ["branching", "navigation", "basics"]
            },
            {
                id: "remote-sync-preview",
                slug: "remote-sync-preview",
                title: "Сначала обнови `origin/main` перед интеграцией",
                summary: "Подтверди, что локальные данные об origin/main могли устареть, и начни с fetch, а не с немедленного pull.",
                difficulty: "intermediate",
                tags: ["remote", "planning"]
            },
            {
                id: "stash-checkpoint-draft",
                slug: "stash-checkpoint-draft",
                title: "Убери черновик в stash перед переключением",
                summary: "Сначала зафиксируй текущий рабочий контекст, а затем убери изменения и untracked файлы в stash.",
                difficulty: "intermediate",
                tags: ["stash", "safety", "workspace"]
            }
        ],
        meta: {
            source: "db-seeded",
            query: {}
        }
    };
}

function createSandboxCatalogProvider() {
    return {
        name: "backend-api",
        async browseCatalog() {
            return {
                items: createCatalogPayload().items,
                meta: {
                    source: "backend-api",
                    query: {}
                }
            };
        }
    };
}

function createSandboxDetailProvider() {
    return {
        name: "backend-api",
        async loadScenarioDetail(slug) {
            if (slug !== "merge-sandbox-outline") {
                throw new Error(`Unexpected sandbox detail request: ${slug}`);
            }

            return createMergeSandboxDetailPayload();
        }
    };
}

function createSandboxSessionProvider() {
    return {
        name: "backend-api",
        async startSession({ scenarioSlug }) {
            if (scenarioSlug !== "merge-sandbox-outline") {
                throw new Error(`Unexpected sandbox session request: ${scenarioSlug}`);
            }

            return createStartSessionPayload("merge-sandbox-outline");
        },
        async submitAnswer(sessionId, submission) {
            if (sessionId !== "session-1") {
                throw new Error(`Unexpected sandbox session id: ${sessionId}`);
            }

            if (submission.answerType !== "command_text") {
                throw new Error(`Unexpected answer type: ${submission.answerType}`);
            }

            return createSandboxSubmissionPayload(submission.answer);
        }
    };
}

function createSandboxProgressProvider() {
    return {
        name: "backend-api",
        async loadProgressSummary() {
            return createInitialProgressPayload();
        }
    };
}

function createBranchSafetyDetailPayload() {
    return {
        id: "branch-safety",
        slug: "branch-safety",
        title: "Подтверди ветку и незавершённый hotfix",
        summary: "Сначала выясни, на какой ветке уже есть незавершённые изменения, и только потом решай, допустимо ли переключение.",
        difficulty: "beginner",
        tags: ["branching", "navigation", "basics"],
        meta: {
            source: "db-seeded",
            stub: true
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "db-seeded",
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
                status: "db-seeded",
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

function createMergeSandboxDetailPayload() {
    return {
        id: "merge-sandbox-outline",
        slug: "merge-sandbox-outline",
        title: "Сравни diff перед попыткой merge",
        summary: "Вы на `feature/mock-merge-window` с незавершёнными правками. Перед merge безопасно посмотреть diff с `main` или общий граф веток, а не запускать слияние сразу.",
        difficulty: "intermediate",
        tags: ["branching", "history", "planning"],
        meta: {
            source: "backend-api",
            stub: true
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "db-seeded",
                goal: "Сначала сравните незавершённую ветку с main и только потом решайте, нужен ли merge.",
                instructions: [
                    {
                        id: "inspect-before-merge",
                        text: "Начните с команды чтения diff или графа веток."
                    }
                ],
                steps: [
                    {
                        position: 1,
                        title: "Посмотрите расхождение с main",
                        detail: "Сначала оцените текущие отличия, а не запускайте merge вслепую."
                    }
                ],
                annotations: []
            },
            repositoryContext: {
                status: "db-seeded",
                branches: [
                    { name: "feature/mock-merge-window", current: true },
                    { name: "main", current: false }
                ],
                commits: [
                    { id: "d48cf83", summary: "feat: draft merge preview panel" }
                ],
                files: [
                    { path: "frontend/src/merge/preview.js", status: "modified" },
                    { path: "docs/merge-playbook.md", status: "modified" }
                ],
                annotations: [
                    {
                        label: "Незавершённый черновик",
                        message: "Ветка ещё не готова к merge: сначала сравните изменения с main."
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
        title: "Сначала обнови `origin/main` перед интеграцией",
        summary: "Подтверди, что локальные данные об origin/main могли устареть, и начни с fetch, а не с немедленного pull.",
        difficulty: "intermediate",
        tags: ["remote", "planning"],
        meta: {
            source: "db-seeded",
            stub: true
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "db-seeded",
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
                status: "db-seeded",
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
        title: "Убери черновик в stash перед переключением",
        summary: "Сначала зафиксируй текущий рабочий контекст, а затем убери изменения и untracked файлы в stash.",
        difficulty: "intermediate",
        tags: ["stash", "safety", "workspace"],
        meta: {
            source: "db-seeded",
            stub: true
        },
        workspace: {
            shell: {
                leftPanelTitle: "Карта сценария",
                centerPanelTitle: "Урок",
                rightPanelTitle: "Практика"
            },
            task: {
                status: "db-seeded",
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
                status: "db-seeded",
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
                ? "Сначала обнови `origin/main` перед интеграцией"
                : scenarioSlug === "stash-checkpoint-draft"
                    ? "Убери черновик в stash перед переключением"
                    : scenarioSlug === "merge-sandbox-outline"
                        ? "Сравни diff перед попыткой merge"
                    : "Подтверди ветку и незавершённый hotfix",
            source: "db-seeded"
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

function createSandboxSubmissionPayload(answer) {
    return {
        submissionId: "submission-1",
        submittedAnswer: {
            answerType: "command_text",
            answer
        },
        outcome: {
            correctness: "correct",
            code: "sandbox-command-accepted",
            message: "Команда подходит для безопасного изучения состояния перед merge."
        },
        terminalOutput: {
            stdout: "git diff main...HEAD\nfrontend/src/merge/preview.js\n",
            stderr: ""
        },
        retryFeedback: {
            status: "resolved",
            retryState: {
                status: "complete",
                attemptNumber: 1,
                eligibility: "completed"
            },
            explanation: {
                status: "resolved",
                title: "Повторное объяснение не требуется",
                tone: "positive",
                message: "Проверка состояния перед merge выполнена корректно.",
                details: []
            },
            hint: {
                status: "resolved",
                level: "baseline",
                message: "Подсказки больше не нужны.",
                reveals: []
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
                scenarioTitle: "Подтверди ветку и незавершённый hotfix",
                status: "in_progress",
                attemptCount: 0,
                completionCount: 0,
                lastActivityAt: "2026-03-21T00:23:59.526366Z"
            }
        ],
        recentActivity: [
            {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Подтверди ветку и незавершённый hotfix",
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
                    scenarioTitle: "Подтверди ветку и незавершённый hotfix"
                }
            ],
            next: {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Подтверди ветку и незавершённый hotfix"
            },
            rationale: "Продолжайте сценарий, который уже начали, чтобы не терять контекст."
        },
        meta: {
            source: "db-seeded"
        }
    };
}

function createCompletedProgressPayload() {
    return {
        items: [
            {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Подтверди ветку и незавершённый hotfix",
                status: "completed",
                attemptCount: 1,
                completionCount: 1,
                lastActivityAt: "2026-03-21T00:24:05.818771Z"
            }
        ],
        recentActivity: [
            {
                scenarioSlug: "branch-safety",
                scenarioTitle: "Подтверди ветку и незавершённый hotfix",
                status: "completed",
                eventType: "completed",
                happenedAt: "2026-03-21T00:24:05.818771Z"
            }
        ],
        recommendations: {
            solved: [
                {
                    scenarioSlug: "branch-safety",
                    scenarioTitle: "Подтверди ветку и незавершённый hotfix"
                }
            ],
            attempted: [],
            next: {
                scenarioSlug: "remote-sync-preview",
                scenarioTitle: "Сначала обнови `origin/main` перед интеграцией"
            },
            rationale: "Продолжайте сценарий, который уже начали, чтобы не терять контекст."
        },
        meta: {
            source: "db-seeded"
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

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function installTerminalHistoryMetrics(windowLike) {
    const prototype = windowLike.HTMLElement.prototype;

    Object.defineProperty(prototype, "clientHeight", {
        configurable: true,
        get() {
            if (this instanceof windowLike.HTMLElement && this.classList?.contains("workspace-terminal__history")) {
                return 120;
            }

            return 0;
        }
    });

    Object.defineProperty(prototype, "scrollHeight", {
        configurable: true,
        get() {
            if (this instanceof windowLike.HTMLElement && this.classList?.contains("workspace-terminal__history")) {
                return 360;
            }

            return 0;
        }
    });
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

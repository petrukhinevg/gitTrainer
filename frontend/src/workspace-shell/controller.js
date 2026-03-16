import { SessionTransportError } from "../session/session-provider.js";
import { renderCatalogWorkspace } from "./view.js";

const DEFAULT_PROVIDER_NAME = "local-fixture";
const NAVIGATION_TOGGLE_ANIMATION_MS = 240;
const DEFAULT_QUERY = Object.freeze({
    difficulty: null,
    tags: [],
    sort: null
});

export function createCatalogWorkspaceController({
    appRoot,
    catalogProviderFactories,
    detailProviderFactories,
    sessionProviderFactories,
    tagOptions
}) {
    const state = {
        route: "catalog",
        selectedScenarioSlug: null,
        selectedFocus: null,
        expandedScenarioSlugs: [],
        providerName: DEFAULT_PROVIDER_NAME,
        submissionDraft: createInitialSubmissionDraftState(),
        session: createInitialSessionState(),
        query: cloneQuery(DEFAULT_QUERY),
        catalog: {
            status: "idle",
            items: [],
            meta: null,
            error: null
        },
        detail: {
            status: "idle",
            data: null,
            error: null
        },
        detailCache: {
        }
    };

    let latestCatalogRequestId = 0;
    let latestDetailRequestId = 0;
    let latestSessionBootstrapRequestId = 0;
    let latestSubmissionRequestId = 0;
    const detailLoadTasks = new Map();
    const sessionProviders = new Map();
    let navigationAnimationInProgress = false;

    async function bootstrap() {
        window.addEventListener("hashchange", handleRouteChange);
        window.addEventListener("resize", syncNavigationPaneWidth);

        if (!window.location.hash) {
            window.location.hash = "#/catalog";
            return;
        }

        await handleRouteChange();
    }

    async function handleRouteChange() {
        const previousRoute = state.route;
        const previousScenarioSlug = state.selectedScenarioSlug;
        const previousProviderName = state.providerName;
        const route = parseRoute(window.location.hash);

        state.route = route.name;
        state.selectedScenarioSlug = route.scenarioSlug;
        state.selectedFocus = route.focus;

        if (route.name === "exercise" && route.scenarioSlug) {
            expandScenario(route.scenarioSlug, { loadDetail: false });
        }

        resetRouteScopedState({
            previousRoute,
            previousScenarioSlug,
            previousProviderName
        });
        render();

        if (state.route === "not-found") {
            return;
        }

        await Promise.all([
            loadCatalog(),
            state.route === "exercise" ? loadScenarioDetail(state.selectedScenarioSlug, { syncSelected: true }) : Promise.resolve(),
            state.route === "exercise" ? ensureExerciseSession() : Promise.resolve()
        ]);
    }

    async function loadCatalog() {
        const requestId = ++latestCatalogRequestId;
        const providerName = state.providerName;
        const querySnapshot = cloneQuery(state.query);

        state.catalog.status = "loading";
        state.catalog.items = [];
        state.catalog.meta = null;
        state.catalog.error = null;
        render();

        try {
            const providerFactory = catalogProviderFactories[providerName];
            if (!providerFactory) {
                throw new Error(`Unknown catalog provider: ${providerName}`);
            }

            const provider = providerFactory();
            const catalog = await provider.browseCatalog(querySnapshot);
            if (requestId !== latestCatalogRequestId) {
                return;
            }

            state.catalog.items = catalog.items;
            state.catalog.meta = catalog.meta;
            state.catalog.status = catalog.items.length === 0 ? "empty" : "ready";
        } catch (error) {
            if (requestId !== latestCatalogRequestId) {
                return;
            }

            state.catalog.items = [];
            state.catalog.meta = null;
            state.catalog.error = error instanceof Error ? error.message : "Unknown catalog error";
            state.catalog.status = "error";
        }

        if (requestId !== latestCatalogRequestId) {
            return;
        }

        render();
    }

    async function loadScenarioDetail(slug = state.selectedScenarioSlug, { syncSelected = false } = {}) {
        if (!slug) {
            state.detail.status = "missing";
            state.detail.data = null;
            state.detail.error = "Scenario slug is missing from the exercise route.";
            render();
            return;
        }

        const requestId = syncSelected ? ++latestDetailRequestId : latestDetailRequestId;
        const providerName = state.providerName;
        const cachedDetail = state.detailCache[slug];

        if (cachedDetail?.status === "ready") {
            if (syncSelected) {
                state.detail.status = "ready";
                state.detail.data = cachedDetail.data;
                state.detail.error = null;
                render();
            }
            return;
        }

        if (syncSelected) {
            state.detail.status = "loading";
            state.detail.data = null;
            state.detail.error = null;
        }

        state.detailCache[slug] = {
            status: "loading",
            data: null,
            error: null
        };
        render();

        if (detailLoadTasks.has(slug)) {
            await detailLoadTasks.get(slug);
            syncSelectedDetailFromCache(slug, requestId, syncSelected);
            return;
        }

        try {
            const detailLoadTask = (async () => {
                const providerFactory = detailProviderFactories[providerName];
                if (!providerFactory) {
                    throw new Error(`Unknown scenario detail provider: ${providerName}`);
                }

                const provider = providerFactory();
                const detail = await provider.loadScenarioDetail(slug);
                state.detailCache[slug] = {
                    status: "ready",
                    data: detail,
                    error: null
                };
            })();

            detailLoadTasks.set(slug, detailLoadTask);
            await detailLoadTask;
        } catch (error) {
            state.detailCache[slug] = {
                status: "error",
                data: null,
                error: error instanceof Error ? error.message : "Unknown scenario detail error"
            };
        } finally {
            detailLoadTasks.delete(slug);
        }

        syncSelectedDetailFromCache(slug, requestId, syncSelected);
    }

    function render() {
        const selectedCatalogScenario = resolveSelectedCatalogScenario(state, state.catalog.items);
        const isExerciseRoute = state.route === "exercise";
        appRoot.classList.toggle("app-shell--exercise", isExerciseRoute);
        appRoot.innerHTML = renderCatalogWorkspace({
            state,
            selectedCatalogScenario,
            tagOptions
        });

        syncNavigationPaneWidth();
        bindNavigationControls();
        bindPracticeSurfaceControls();
    }

    function bindNavigationControls() {
        document.querySelectorAll("[data-scenario-toggle]").forEach((button) => {
            button.addEventListener("click", () => {
                const slug = button.dataset.scenarioToggle;
                if (!slug) {
                    return;
                }

                void toggleScenarioExpansion(slug);
            });
        });
    }

    function bindPracticeSurfaceControls() {
        const form = document.querySelector("[data-submission-draft-form]");
        if (form) {
            form.addEventListener("input", handleSubmissionDraftInput);
            form.addEventListener("change", handleSubmissionDraftInput);
            form.addEventListener("submit", (event) => {
                void handleSubmissionDraftSubmit(event);
            });
            form.querySelector("[data-reset-submission-draft]")?.addEventListener("click", resetSubmissionDraft);
        }

        document.querySelectorAll("[data-session-request-retry]").forEach((button) => {
            button.addEventListener("click", () => {
                const target = button.dataset.sessionRequestRetry;
                if (target === "bootstrap") {
                    void ensureExerciseSession({ force: true });
                    return;
                }

                if (target === "submission") {
                    void retryLastSubmission();
                }
            });
        });

        document.querySelectorAll("[data-session-request-restart]").forEach((button) => {
            button.addEventListener("click", () => {
                void restartExerciseSession();
            });
        });
    }

    function handleSubmissionDraftInput(event) {
        const draftFieldSnapshot = captureDraftFieldSnapshot(event.target);
        const formData = new FormData(event.currentTarget);
        const nextAnswerType = normalizeOptionalValue(formData.get("answerType")) ?? "command_text";
        const nextAnswer = String(formData.get("answer") ?? "");
        const preparedSubmission = state.submissionDraft.preparedSubmission;

        state.submissionDraft.answerType = nextAnswerType;
        state.submissionDraft.answer = nextAnswer;
        state.submissionDraft.validationError = null;

        if (preparedSubmission && (
            preparedSubmission.answerType !== nextAnswerType
            || preparedSubmission.answer !== nextAnswer.trim()
        )) {
            state.submissionDraft.preparedSubmission = null;
            resetSubmissionRequestState();
        }

        render();
        restoreDraftFieldSnapshot(draftFieldSnapshot);
    }

    async function handleSubmissionDraftSubmit(event) {
        event.preventDefault();

        if (state.session.submission.status === "pending" || state.session.bootstrap.status === "pending") {
            return;
        }

        const formData = new FormData(event.currentTarget);
        const answer = String(formData.get("answer") ?? "").trim();

        if (!answer) {
            state.submissionDraft.validationError = "Enter the Git command or action you want to submit.";
            render();
            return;
        }

        const preparedSubmission = {
            scenarioSlug: state.selectedScenarioSlug,
            answerType: normalizeOptionalValue(formData.get("answerType")) ?? "command_text",
            answer,
            preparedAt: new Date().toISOString()
        };

        state.submissionDraft.answerType = preparedSubmission.answerType;
        state.submissionDraft.answer = String(formData.get("answer") ?? "");
        state.submissionDraft.validationError = null;
        state.submissionDraft.preparedSubmission = preparedSubmission;
        render();

        if (state.session.bootstrap.status !== "ready") {
            await ensureExerciseSession({
                force: state.session.bootstrap.status !== "idle"
            });
        }

        if (state.session.bootstrap.status !== "ready") {
            return;
        }

        await submitPreparedSubmission(preparedSubmission);
    }

    function resetSubmissionDraft() {
        state.submissionDraft = createInitialSubmissionDraftState();
        resetSubmissionRequestState();
        render();
    }

    async function ensureExerciseSession({ force = false } = {}) {
        if (state.route !== "exercise" || !state.selectedScenarioSlug) {
            return;
        }

        const scenarioSlug = state.selectedScenarioSlug;
        const bootstrapState = state.session.bootstrap;

        if (!force && bootstrapState.status === "ready" && bootstrapState.response?.scenario?.slug === scenarioSlug) {
            return;
        }

        if (!force && bootstrapState.status === "pending" && bootstrapState.scenarioSlug === scenarioSlug) {
            return;
        }

        const requestId = ++latestSessionBootstrapRequestId;
        ++latestSubmissionRequestId;

        state.session.bootstrap = {
            status: "pending",
            response: null,
            error: null,
            scenarioSlug
        };
        resetSubmissionRequestState();
        render();

        try {
            const provider = resolveSessionProvider(state.providerName);
            const response = await provider.startSession({
                scenarioSlug
            });
            if (requestId !== latestSessionBootstrapRequestId || scenarioSlug !== state.selectedScenarioSlug) {
                return;
            }

            state.session.bootstrap = {
                status: "ready",
                response,
                error: null,
                scenarioSlug
            };
            resetSubmissionRequestState();
        } catch (error) {
            if (requestId !== latestSessionBootstrapRequestId || scenarioSlug !== state.selectedScenarioSlug) {
                return;
            }

            const normalizedFailure = normalizeTransportFailure(error, "Session bootstrap failed.");
            state.session.bootstrap = {
                status: `${normalizedFailure.failureKind}-error`,
                response: null,
                error: normalizedFailure,
                scenarioSlug
            };
        }

        if (requestId !== latestSessionBootstrapRequestId || scenarioSlug !== state.selectedScenarioSlug) {
            return;
        }

        render();
    }

    async function submitPreparedSubmission(preparedSubmission) {
        if (state.session.bootstrap.status !== "ready") {
            return;
        }

        const activeSessionId = state.session.bootstrap.response?.sessionId;
        if (!activeSessionId) {
            state.session.submission = {
                status: "terminal-error",
                response: null,
                error: {
                    failureKind: "terminal",
                    message: "Session transport is missing an active session id.",
                    status: null
                },
                lastPayload: preparedSubmission
            };
            render();
            return;
        }

        const requestId = ++latestSubmissionRequestId;
        state.session.submission = {
            status: "pending",
            response: null,
            error: null,
            lastPayload: preparedSubmission
        };
        render();

        try {
            const provider = resolveSessionProvider(state.providerName);
            const response = await provider.submitAnswer(activeSessionId, {
                answerType: preparedSubmission.answerType,
                answer: preparedSubmission.answer
            });
            if (requestId !== latestSubmissionRequestId) {
                return;
            }

            state.session.submission = {
                status: "ready",
                response,
                error: null,
                lastPayload: preparedSubmission
            };

            if (state.session.bootstrap.response) {
                state.session.bootstrap.response = {
                    ...state.session.bootstrap.response,
                    lifecycle: response.lifecycle
                };
            }
        } catch (error) {
            if (requestId !== latestSubmissionRequestId) {
                return;
            }

            const normalizedFailure = normalizeTransportFailure(error, "Answer submission failed.");
            state.session.submission = {
                status: `${normalizedFailure.failureKind}-error`,
                response: null,
                error: normalizedFailure,
                lastPayload: preparedSubmission
            };
        }

        if (requestId !== latestSubmissionRequestId) {
            return;
        }

        render();
    }

    async function retryLastSubmission() {
        const lastPayload = state.session.submission.lastPayload ?? state.submissionDraft.preparedSubmission;
        if (!lastPayload) {
            return;
        }

        if (state.session.bootstrap.status !== "ready") {
            await ensureExerciseSession({ force: true });
            if (state.session.bootstrap.status !== "ready") {
                return;
            }
        }

        await submitPreparedSubmission(lastPayload);
    }

    async function restartExerciseSession() {
        state.session = createInitialSessionState();
        resetSubmissionRequestState();
        render();
        await ensureExerciseSession({ force: true });
    }

    async function reloadActiveRouteData() {
        await Promise.all([
            loadCatalog(),
            state.route === "exercise" ? loadScenarioDetail() : Promise.resolve(),
            state.route === "exercise" ? ensureExerciseSession({ force: true }) : Promise.resolve()
        ]);
    }

    function resetRouteScopedState({ previousRoute, previousScenarioSlug, previousProviderName }) {
        const sameExerciseScenario = previousRoute === "exercise"
            && state.route === "exercise"
            && previousScenarioSlug === state.selectedScenarioSlug
            && previousProviderName === state.providerName;

        if (!sameExerciseScenario) {
            state.submissionDraft = createInitialSubmissionDraftState();
            state.session = createInitialSessionState();
            ++latestSessionBootstrapRequestId;
            ++latestSubmissionRequestId;
        }

        if (state.route !== "exercise") {
            state.selectedFocus = null;
            state.detail.status = "idle";
            state.detail.data = null;
            state.detail.error = null;
        }
    }

    function resetSubmissionRequestState() {
        state.session.submission = createInitialSubmissionRequestState();
    }

    function captureDraftFieldSnapshot(field) {
        if (
            !(field instanceof HTMLInputElement)
            && !(field instanceof HTMLTextAreaElement)
            && !(field instanceof HTMLSelectElement)
        ) {
            return null;
        }

        return {
            name: field.name,
            selectionStart: typeof field.selectionStart === "number" ? field.selectionStart : null,
            selectionEnd: typeof field.selectionEnd === "number" ? field.selectionEnd : null,
            selectionDirection: field.selectionDirection ?? "none"
        };
    }

    function restoreDraftFieldSnapshot(snapshot) {
        if (!snapshot?.name) {
            return;
        }

        const restoredField = appRoot.querySelector(
            `[data-submission-draft-form] [name="${escapeSelectorValue(snapshot.name)}"]`
        );

        if (
            !(restoredField instanceof HTMLInputElement)
            && !(restoredField instanceof HTMLTextAreaElement)
            && !(restoredField instanceof HTMLSelectElement)
        ) {
            return;
        }

        restoredField.focus({ preventScroll: true });

        if (
            typeof snapshot.selectionStart === "number"
            && typeof snapshot.selectionEnd === "number"
            && (
                restoredField instanceof HTMLInputElement
                || restoredField instanceof HTMLTextAreaElement
            )
        ) {
            const valueLength = restoredField.value.length;
            restoredField.setSelectionRange(
                Math.min(snapshot.selectionStart, valueLength),
                Math.min(snapshot.selectionEnd, valueLength),
                snapshot.selectionDirection
            );
        }
    }

    function resolveSessionProvider(providerName) {
        if (sessionProviders.has(providerName)) {
            return sessionProviders.get(providerName);
        }

        const providerFactory = sessionProviderFactories[providerName];
        if (!providerFactory) {
            throw new SessionTransportError(`Unknown session provider: ${providerName}`, {
                failureKind: "terminal"
            });
        }

        const provider = providerFactory();
        sessionProviders.set(providerName, provider);
        return provider;
    }

    return {
        bootstrap
    };

    function syncNavigationPaneWidth() {
        const lessonLayout = appRoot.querySelector(".lesson-layout");
        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        if (!lessonLayout || !navigationLane || window.innerWidth <= 900) {
            lessonLayout?.style.removeProperty("--navigation-pane-width");
            return;
        }

        const flowBlocks = [...navigationLane.querySelectorAll(".flow-block")];
        if (!flowBlocks.length) {
            lessonLayout.style.removeProperty("--navigation-pane-width");
            return;
        }

        const maxContentWidth = measureNaturalNavigationWidth(navigationLane);
        const maxWidth = Math.ceil(maxContentWidth + 36);
        const minWidth = Math.ceil(maxWidth / 2);
        const preferredWidth = Math.round(window.innerWidth * 0.24);
        const targetWidth = Math.min(maxWidth, Math.max(minWidth, preferredWidth));

        lessonLayout.style.setProperty("--navigation-pane-width", `${targetWidth}px`);
    }

    function expandScenario(slug, { loadDetail = true } = {}) {
        if (!slug || state.expandedScenarioSlugs.includes(slug)) {
            return;
        }

        state.expandedScenarioSlugs = [...state.expandedScenarioSlugs, slug];
        if (loadDetail) {
            void loadScenarioDetail(slug, { syncSelected: false });
        }
    }

    function collapseScenario(slug) {
        state.expandedScenarioSlugs = state.expandedScenarioSlugs.filter((item) => item !== slug);
    }

    function syncSelectedDetailFromCache(slug, requestId, syncSelected) {
        if (!syncSelected || requestId !== latestDetailRequestId || slug !== state.selectedScenarioSlug) {
            render();
            return;
        }

        const cachedDetail = state.detailCache[slug];
        if (!cachedDetail) {
            state.detail.status = "error";
            state.detail.data = null;
            state.detail.error = "Unknown scenario detail error";
            render();
            return;
        }

        state.detail.status = cachedDetail.status;
        state.detail.data = cachedDetail.data;
        state.detail.error = cachedDetail.error;
        render();
    }

    async function toggleScenarioExpansion(slug) {
        if (navigationAnimationInProgress) {
            return;
        }

        if (state.expandedScenarioSlugs.includes(slug)) {
            navigationAnimationInProgress = true;

            try {
                await animateScenarioCollapse(slug);
                collapseScenario(slug);
                render();
            } finally {
                navigationAnimationInProgress = false;
            }

            return;
        }

        navigationAnimationInProgress = true;
        expandScenario(slug, { loadDetail: false });
        render();

        try {
            await Promise.all([
                animateScenarioExpansion(slug),
                loadScenarioDetail(slug, { syncSelected: false })
            ]);
        } finally {
            navigationAnimationInProgress = false;
        }
    }

    function animateScenarioExpansion(slug) {
        const panel = findScenarioPanel(slug);
        if (!panel || prefersReducedMotion()) {
            return Promise.resolve();
        }

        panel.style.height = "0px";
        panel.style.opacity = "0";
        panel.style.overflow = "hidden";

        const targetHeight = panel.scrollHeight;
        panel.getBoundingClientRect();

        panel.style.transition = createScenarioPanelTransition();
        panel.style.height = `${targetHeight}px`;
        panel.style.opacity = "1";

        return waitForScenarioAnimation(panel, () => {
            panel.style.removeProperty("height");
            panel.style.removeProperty("opacity");
            panel.style.removeProperty("overflow");
            panel.style.removeProperty("transition");
        });
    }

    function animateScenarioCollapse(slug) {
        const panel = findScenarioPanel(slug);
        if (!panel || prefersReducedMotion()) {
            return Promise.resolve();
        }

        panel.style.height = `${panel.getBoundingClientRect().height}px`;
        panel.style.opacity = "1";
        panel.style.overflow = "hidden";
        panel.getBoundingClientRect();

        panel.style.transition = createScenarioPanelTransition();
        panel.style.height = "0px";
        panel.style.opacity = "0";

        return waitForScenarioAnimation(panel, () => {
            panel.style.removeProperty("transition");
        });
    }

    function findScenarioPanel(slug) {
        return appRoot.querySelector(`[data-scenario-panel="${escapeSelectorValue(slug)}"]`);
    }

    function createScenarioPanelTransition() {
        return [
            `height ${NAVIGATION_TOGGLE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            `opacity ${Math.round(NAVIGATION_TOGGLE_ANIMATION_MS * 0.7)}ms ease`
        ].join(", ");
    }

    function waitForScenarioAnimation(panel, cleanup) {
        return new Promise((resolve) => {
            let settled = false;

            const finalize = () => {
                if (settled) {
                    return;
                }

                settled = true;
                panel.removeEventListener("transitionend", handleTransitionEnd);
                window.clearTimeout(timeoutId);
                cleanup();
                resolve();
            };

            const handleTransitionEnd = (event) => {
                if (event.target === panel && event.propertyName === "height") {
                    finalize();
                }
            };

            const timeoutId = window.setTimeout(finalize, NAVIGATION_TOGGLE_ANIMATION_MS + 120);
            panel.addEventListener("transitionend", handleTransitionEnd);
        });
    }

    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
}

function parseRoute(hash) {
    if (hash === "#/catalog") {
        return {
            name: "catalog",
            scenarioSlug: null,
            focus: null
        };
    }

    const exerciseMatch = hash.match(/^#\/exercise\/([^?#]+)(?:\?([^#]+))?$/);
    if (exerciseMatch) {
        const query = new URLSearchParams(exerciseMatch[2] ?? "");
        return {
            name: "exercise",
            scenarioSlug: decodeURIComponent(exerciseMatch[1]),
            focus: normalizeOptionalValue(query.get("focus"))
        };
    }

    return {
        name: "not-found",
        scenarioSlug: null,
        focus: null
    };
}

function resolveSelectedCatalogScenario(state, catalogItems) {
    if (!state.selectedScenarioSlug) {
        return null;
    }

    return catalogItems.find((item) => item.slug === state.selectedScenarioSlug) ?? null;
}

function normalizeOptionalValue(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

function cloneQuery(query) {
    return {
        difficulty: query.difficulty,
        tags: [...query.tags],
        sort: query.sort
    };
}

function createInitialSubmissionDraftState() {
    return {
        answerType: "command_text",
        answer: "",
        validationError: null,
        preparedSubmission: null
    };
}

function createInitialSessionState() {
    return {
        bootstrap: {
            status: "idle",
            response: null,
            error: null,
            scenarioSlug: null
        },
        submission: createInitialSubmissionRequestState()
    };
}

function createInitialSubmissionRequestState() {
    return {
        status: "idle",
        response: null,
        error: null,
        lastPayload: null
    };
}

function normalizeTransportFailure(error, fallbackMessage) {
    if (error instanceof SessionTransportError) {
        const failureKind = resolveFailureKind({
            failureDisposition: error.failureDisposition,
            retryable: error.retryable,
            failureKind: error.failureKind,
            status: error.status
        });
        return {
            failureKind,
            failureDisposition: error.failureDisposition ?? failureKind,
            retryable: typeof error.retryable === "boolean" ? error.retryable : failureKind === "retryable",
            code: error.code,
            message: error.message || fallbackMessage,
            status: error.status
        };
    }

    if (error instanceof Error) {
        return {
            failureKind: "retryable",
            failureDisposition: "retryable",
            retryable: true,
            code: null,
            message: error.message || fallbackMessage,
            status: null
        };
    }

    return {
        failureKind: "retryable",
        failureDisposition: "retryable",
        retryable: true,
        code: null,
        message: fallbackMessage,
        status: null
    };
}

function resolveFailureKind({ failureDisposition, retryable, failureKind, status }) {
    if (failureDisposition === "terminal" || failureDisposition === "retryable") {
        return failureDisposition;
    }

    if (typeof retryable === "boolean") {
        return retryable ? "retryable" : "terminal";
    }

    if (failureKind === "terminal" || failureKind === "retryable") {
        return failureKind;
    }

    if (status === 408 || status === 425 || status === 429 || status >= 500) {
        return "retryable";
    }

    return "terminal";
}

function measureNaturalNavigationWidth(navigationLane) {
    const scrollContent = navigationLane.querySelector(".lesson-lane__scroll-content");
    if (!scrollContent) {
        return navigationLane.scrollWidth;
    }

    const measureRoot = document.createElement("div");
    measureRoot.style.position = "fixed";
    measureRoot.style.left = "-10000px";
    measureRoot.style.top = "0";
    measureRoot.style.visibility = "hidden";
    measureRoot.style.pointerEvents = "none";
    measureRoot.style.width = "max-content";
    measureRoot.style.maxWidth = "none";
    measureRoot.style.minWidth = "0";

    const clone = scrollContent.cloneNode(true);
    clone.style.width = "max-content";
    clone.style.minWidth = "max-content";
    clone.style.maxWidth = "none";
    clone.style.paddingLeft = "18px";
    clone.style.paddingRight = "18px";

    measureRoot.append(clone);
    document.body.append(measureRoot);

    const width = clone.getBoundingClientRect().width;
    measureRoot.remove();

    return width;
}

function escapeSelectorValue(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
        return CSS.escape(value);
    }

    return value.replace(/"/g, '\\"');
}

import { SessionTransportError } from "../session/session-provider.js";
import {
    renderCatalogWorkspace,
    renderCatalogWorkspaceShell,
    renderCatalogWorkspaceSurfaces
} from "./view.js";

const DEFAULT_PROVIDER_NAME = "local-fixture";
const NAVIGATION_TOGGLE_ANIMATION_MS = 240;
const SMOOTH_WHEEL_SCROLL_DURATION_MS = 180;
const DEFAULT_QUERY = Object.freeze({
    difficulty: null,
    tags: [],
    sort: null
});
const smoothWheelScrollState = new WeakMap();

export function createCatalogWorkspaceController({
    appRoot,
    catalogProviderFactories,
    detailProviderFactories,
    sessionProviderFactories,
    progressProviderFactories,
    tagOptions
}) {
    const state = {
        route: "catalog",
        selectedScenarioSlug: null,
        selectedFocus: null,
        expandedScenarioSlugs: [],
        pinnedNavigationTag: null,
        providerName: DEFAULT_PROVIDER_NAME,
        submissionDraft: createInitialSubmissionDraftState(),
        session: createInitialSessionState(),
        progress: createInitialProgressState(),
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
    let latestProgressRequestId = 0;
    const detailLoadTasks = new Map();
    const sessionProviders = new Map();
    const progressProviders = new Map();
    let navigationAnimationInProgress = false;
    let shellMounted = false;
    let renderedRouteKind = null;
    const renderedSurfaceCache = {
        navigation: null,
        lesson: null,
        practiceViewer: null,
        practiceSurface: null
    };
    const providerOptions = resolveSharedProviderOptions({
        catalogProviderFactories,
        detailProviderFactories,
        sessionProviderFactories,
        progressProviderFactories
    });

    async function bootstrap() {
        window.addEventListener("hashchange", handleRouteChange);

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
            ensureCatalogLoaded(),
            state.route === "progress" ? loadProgressSummary() : Promise.resolve(),
            state.route === "exercise" ? loadScenarioDetail(state.selectedScenarioSlug, { syncSelected: true }) : Promise.resolve(),
            state.route === "exercise" ? ensureExerciseSession() : Promise.resolve()
        ]);
    }

    function ensureCatalogLoaded() {
        if (state.catalog.status !== "idle") {
            return Promise.resolve();
        }

        return loadCatalog();
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
                throw new Error(`Неизвестный источник каталога: ${providerName}`);
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
            state.catalog.error = toUserFacingRecoveryMessage(
                error instanceof Error ? error.message : null,
                "Источник каталога сейчас недоступен. Повторите чуть позже."
            );
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
            state.detail.error = "В маршруте упражнения не указан код сценария.";
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

        // For background preloads from the left rail, the panel already shows the
        // loading placeholder after the expansion render. Avoid replacing that DOM
        // subtree here, otherwise the first-open animation gets interrupted before
        // the height transition can complete.
        if (syncSelected) {
            render();
        }

        if (detailLoadTasks.has(slug)) {
            await detailLoadTasks.get(slug);
            syncSelectedDetailFromCache(slug, requestId, syncSelected);
            return;
        }

        try {
            const detailLoadTask = (async () => {
                const providerFactory = detailProviderFactories[providerName];
                if (!providerFactory) {
                    throw new Error(`Неизвестный источник деталей сценария: ${providerName}`);
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
                error: toUserFacingRecoveryMessage(
                    error instanceof Error ? error.message : null,
                    "Источник деталей сценария сейчас недоступен. Повторите чуть позже."
                )
            };
        } finally {
            detailLoadTasks.delete(slug);
        }

        syncSelectedDetailFromCache(slug, requestId, syncSelected);
    }

    async function loadProgressSummary() {
        if (state.route !== "progress") {
            return;
        }

        const requestId = ++latestProgressRequestId;
        state.progress.status = "loading";
        state.progress.summary = null;
        state.progress.error = null;
        render();

        try {
            const provider = resolveProgressProvider(state.providerName);
            const summary = await provider.loadProgressSummary();
            if (requestId !== latestProgressRequestId || state.route !== "progress") {
                return;
            }

            state.progress.summary = summary;
            state.progress.error = null;
            state.progress.status = isEmptyProgressSummary(summary) ? "empty" : "ready";
        } catch (error) {
            if (requestId !== latestProgressRequestId || state.route !== "progress") {
                return;
            }

            state.progress.summary = null;
            state.progress.error = toUserFacingRecoveryMessage(
                error instanceof Error ? error.message : null,
                "Сводка прогресса сейчас недоступна. Повторите чуть позже."
            );
            state.progress.status = "error";
        }

        if (requestId !== latestProgressRequestId || state.route !== "progress") {
            return;
        }

        render();
    }

    function render() {
        const selectedCatalogScenario = resolveSelectedCatalogScenario(state, state.catalog.items);
        const isExerciseRoute = state.route === "exercise";
        const isNotFoundRoute = state.route === "not-found";
        const nextRouteKind = isNotFoundRoute ? "not-found" : "workspace";
        const laneScrollPositions = captureLaneScrollPositions();
        appRoot.classList.toggle("app-shell--exercise", isExerciseRoute);

        if (renderedRouteKind !== nextRouteKind) {
            renderedRouteKind = nextRouteKind;
            shellMounted = false;
            resetRenderedSurfaceCache();
        }

        if (isNotFoundRoute) {
            appRoot.innerHTML = renderCatalogWorkspace({
                state,
                selectedCatalogScenario,
                tagOptions,
                providerOptions
            });
        } else {
            ensureWorkspaceShellMounted();
            renderWorkspaceSurfaces(selectedCatalogScenario);
        }

        restoreLaneScrollPositions(laneScrollPositions);
        requestAnimationFrame(() => {
            restoreLaneScrollPositions(laneScrollPositions);
        });
        bindCatalogControls();
        bindRouteLinks();
        bindNavigationControls();
        bindPracticeSurfaceControls();
        bindSmoothScrollContainers();
    }

    function ensureWorkspaceShellMounted() {
        if (shellMounted) {
            return;
        }

        appRoot.innerHTML = renderCatalogWorkspaceShell();
        shellMounted = true;
    }

    function renderWorkspaceSurfaces(selectedCatalogScenario) {
        const surfaces = renderCatalogWorkspaceSurfaces({
            state,
            selectedCatalogScenario,
            tagOptions,
            providerOptions
        });

        patchSurface("navigation", surfaces.navigation);
        patchSurface("lesson", surfaces.lesson);
        patchSurface("practice-viewer", surfaces.practiceViewer, "practiceViewer");
        patchSurface("practice-surface", surfaces.practiceSurface, "practiceSurface");
    }

    function patchSurface(surfaceName, nextMarkup, cacheKey = surfaceName) {
        if (renderedSurfaceCache[cacheKey] === nextMarkup) {
            return;
        }

        const target = appRoot.querySelector(`[data-render-surface="${escapeSelectorValue(surfaceName)}"]`);
        if (!target) {
            return;
        }

        const previousLaneBody = target.querySelector(".lesson-lane__body");
        const preservedLaneScroll = previousLaneBody
            ? {
                scrollTop: previousLaneBody.scrollTop,
                scrollLeft: previousLaneBody.scrollLeft
            }
            : null;
        const preservedScrollState = captureSurfaceScrollState(target);
        target.innerHTML = nextMarkup;
        const nextLaneBody = target.querySelector(".lesson-lane__body");
        if (nextLaneBody && preservedLaneScroll) {
            nextLaneBody.scrollTop = preservedLaneScroll.scrollTop;
            nextLaneBody.scrollLeft = preservedLaneScroll.scrollLeft;
        }
        restoreSurfaceScrollState(target, preservedScrollState);
        requestAnimationFrame(() => {
            const deferredLaneBody = target.querySelector(".lesson-lane__body");
            if (deferredLaneBody && preservedLaneScroll) {
                deferredLaneBody.scrollTop = preservedLaneScroll.scrollTop;
                deferredLaneBody.scrollLeft = preservedLaneScroll.scrollLeft;
            }

            restoreSurfaceScrollState(target, preservedScrollState);
        });
        renderedSurfaceCache[cacheKey] = nextMarkup;
    }

    function resetRenderedSurfaceCache() {
        renderedSurfaceCache.navigation = null;
        renderedSurfaceCache.lesson = null;
        renderedSurfaceCache.practiceViewer = null;
        renderedSurfaceCache.practiceSurface = null;
    }

    function bindCatalogControls() {
        const form = document.querySelector("[data-catalog-controls-form]");
        if (!form || form.dataset.controlsBound === "true") {
            return;
        }

        form.dataset.controlsBound = "true";
        form.addEventListener("change", () => {
            void applyCatalogControls(form);
        });
        form.addEventListener("submit", (event) => {
            event.preventDefault();
        });
        form.querySelector("[data-reset-catalog-controls]")?.addEventListener("click", () => {
            void resetCatalogControls(form);
        });
    }

    function bindRouteLinks() {
        document.querySelectorAll('a[href^="#/"]').forEach((link) => {
            if (link.dataset.routeLinkBound === "true") {
                return;
            }

            link.dataset.routeLinkBound = "true";
            link.addEventListener("click", (event) => {
                if (
                    event.defaultPrevented
                    || event.button !== 0
                    || event.metaKey
                    || event.ctrlKey
                    || event.shiftKey
                    || event.altKey
                ) {
                    return;
                }

                const nextHash = link.getAttribute("href");
                if (!nextHash || nextHash === window.location.hash) {
                    event.preventDefault();
                    return;
                }

                event.preventDefault();
                window.history.pushState(null, "", nextHash);
                void handleRouteChange();
            });
        });
    }

    function bindNavigationControls() {
        document.querySelectorAll("[data-scenario-toggle]").forEach((button) => {
            if (button.dataset.navigationToggleBound === "true") {
                return;
            }

            button.dataset.navigationToggleBound = "true";
            button.addEventListener("click", () => {
                const slug = button.dataset.scenarioToggle;
                if (!slug) {
                    return;
                }

                void toggleScenarioExpansion(slug);
            });
        });

        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        if (!navigationLane) {
            return;
        }

        const applyNavigationHighlight = (hoveredTag = null) => {
            const activeTag = hoveredTag ?? state.pinnedNavigationTag;
            if (activeTag) {
                navigationLane.dataset.highlightTag = activeTag;
                return;
            }

            delete navigationLane.dataset.highlightTag;
        };

        const syncNavigationLegendState = () => {
            document.querySelectorAll("[data-tag-legend-control]").forEach((button) => {
                const tag = button.dataset.tagLegendControl;
                const isPinned = Boolean(tag) && state.pinnedNavigationTag === tag;
                button.classList.toggle("scenario-legend__tag--active", isPinned);
                button.setAttribute("aria-pressed", isPinned ? "true" : "false");
            });
        };

        applyNavigationHighlight();
        syncNavigationLegendState();

        document.querySelectorAll("[data-tag-legend-control]").forEach((button) => {
            const tag = button.dataset.tagLegendControl;
            if (!tag || button.dataset.tagLegendBound === "true") {
                return;
            }

            button.dataset.tagLegendBound = "true";
            button.addEventListener("mouseenter", () => {
                applyNavigationHighlight(tag);
            });
            button.addEventListener("mouseleave", () => {
                applyNavigationHighlight();
            });
            button.addEventListener("focus", () => {
                applyNavigationHighlight(tag);
            });
            button.addEventListener("blur", () => {
                applyNavigationHighlight();
            });
            button.addEventListener("click", (event) => {
                event.preventDefault();
                state.pinnedNavigationTag = state.pinnedNavigationTag === tag ? null : tag;
                applyNavigationHighlight();
                syncNavigationLegendState();
            });
        });
    }

    function bindPracticeSurfaceControls() {
        const form = document.querySelector("[data-submission-draft-form]");
        if (form && form.dataset.practiceDraftBound !== "true") {
            form.dataset.practiceDraftBound = "true";
            form.addEventListener("input", handleSubmissionDraftInput);
            form.addEventListener("change", handleSubmissionDraftInput);
            form.addEventListener("submit", (event) => {
                void handleSubmissionDraftSubmit(event);
            });
            form.querySelector("[data-reset-submission-draft]")?.addEventListener("click", resetSubmissionDraft);
        }

        document.querySelectorAll("[data-session-request-retry]").forEach((button) => {
            if (button.dataset.sessionRetryBound === "true") {
                return;
            }

            button.dataset.sessionRetryBound = "true";
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
            if (button.dataset.sessionRestartBound === "true") {
                return;
            }

            button.dataset.sessionRestartBound = "true";
            button.addEventListener("click", () => {
                void restartExerciseSession();
            });
        });

        document.querySelectorAll("[data-retry-hint-reveal]").forEach((button) => {
            if (button.dataset.retryHintRevealBound === "true") {
                return;
            }

            button.dataset.retryHintRevealBound = "true";
            button.addEventListener("click", () => {
                revealNextRetryHint();
            });
        });
    }

    async function applyCatalogControls(form) {
        const nextControlsState = readCatalogControls(form);
        const providerChanged = nextControlsState.providerName !== state.providerName;
        const queryChanged = !isSameQuery(state.query, nextControlsState.query);

        if (!providerChanged && !queryChanged) {
            return;
        }

        state.providerName = nextControlsState.providerName;
        state.query = nextControlsState.query;

        if (providerChanged) {
            resetProviderScopedState();
        }

        render();
        await reloadActiveRouteData();
    }

    async function resetCatalogControls(form) {
        const defaults = {
            providerName: DEFAULT_PROVIDER_NAME,
            query: cloneQuery(DEFAULT_QUERY)
        };
        const providerChanged = defaults.providerName !== state.providerName;
        const queryChanged = !isSameQuery(state.query, defaults.query);
        if (!providerChanged && !queryChanged) {
            return;
        }

        state.providerName = defaults.providerName;
        state.query = defaults.query;
        if (providerChanged) {
            resetProviderScopedState();
        }

        form.reset();
        render();
        await reloadActiveRouteData();
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
            state.submissionDraft.validationError = "Введите Git-команду или действие, которое хотите отправить.";
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

            const normalizedFailure = normalizeTransportFailure(error, "Не удалось запустить сессию.");
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
                    message: "У сессии нет активного идентификатора для повторной отправки.",
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
        state.session.feedbackPanel = createFeedbackPanelState({
            previousFeedbackPanel: state.session.feedbackPanel,
            detail: state.detail.data,
            scenarioSlug: state.selectedScenarioSlug,
            preparedSubmission,
            status: "submitting",
            attemptNumber: (state.session.bootstrap.response?.lifecycle?.submissionCount ?? 0) + 1,
            transportDisposition: "pending",
            preserveHintReveals: true
        });
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
            state.session.feedbackPanel = createFeedbackPanelState({
                previousFeedbackPanel: state.session.feedbackPanel,
                detail: state.detail.data,
                scenarioSlug: state.selectedScenarioSlug,
                preparedSubmission,
                status: resolveFeedbackPanelStatus(response),
                attemptNumber: response.attemptNumber,
                transportDisposition: "evaluated",
                correctness: response.outcome?.correctness ?? null,
                outcomeCode: response.outcome?.code ?? null,
                retryFeedback: response.retryFeedback ?? null
            });

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

            const normalizedFailure = normalizeTransportFailure(error, "Не удалось отправить ответ.");
            state.session.submission = {
                status: `${normalizedFailure.failureKind}-error`,
                response: null,
                error: normalizedFailure,
                lastPayload: preparedSubmission
            };
            state.session.feedbackPanel = createFeedbackPanelState({
                previousFeedbackPanel: state.session.feedbackPanel,
                detail: state.detail.data,
                scenarioSlug: state.selectedScenarioSlug,
                preparedSubmission,
                status: "request-failure",
                attemptNumber: state.session.feedbackPanel?.contextSnapshot?.attemptNumber ?? 0,
                transportDisposition: normalizedFailure.failureKind,
                errorMessage: normalizedFailure.message,
                preserveHintReveals: true
            });
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

    function revealNextRetryHint() {
        const feedbackPanel = state.session.feedbackPanel;
        if (!feedbackPanel) {
            return;
        }

        const availableRevealCount = Array.isArray(feedbackPanel.retryFeedback?.hint?.reveals)
            ? feedbackPanel.retryFeedback.hint.reveals.length
            : 0;
        const nextRevealCount = Math.min(
            (feedbackPanel.revealedHintCount ?? 0) + 1,
            availableRevealCount
        );
        state.session.feedbackPanel = {
            ...feedbackPanel,
            revealedHintCount: nextRevealCount
        };
        render();
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
            state.route === "progress" ? loadProgressSummary() : Promise.resolve(),
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

        if (state.route !== "progress") {
            state.progress = createInitialProgressState();
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

    function resetProviderScopedState() {
        state.detail.status = state.route === "exercise" ? "loading" : "idle";
        state.detail.data = null;
        state.detail.error = null;
        state.detailCache = {};
        state.submissionDraft = createInitialSubmissionDraftState();
        state.session = createInitialSessionState();
        state.progress = createInitialProgressState();
        sessionProviders.clear();
        progressProviders.clear();
        ++latestDetailRequestId;
        ++latestSessionBootstrapRequestId;
        ++latestSubmissionRequestId;
        ++latestProgressRequestId;
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
            throw new SessionTransportError(`Неизвестный источник для запуска сессии: ${providerName}`, {
                failureKind: "terminal"
            });
        }

        const provider = providerFactory();
        sessionProviders.set(providerName, provider);
        return provider;
    }

    function resolveProgressProvider(providerName) {
        if (progressProviders.has(providerName)) {
            return progressProviders.get(providerName);
        }

        const providerFactory = progressProviderFactories[providerName];
        if (!providerFactory) {
            throw new Error(`Неизвестный источник данных прогресса: ${providerName}`);
        }

        const provider = providerFactory();
        progressProviders.set(providerName, provider);
        return provider;
    }

    return {
        bootstrap
    };

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
            state.detail.error = "Неизвестная ошибка деталей сценария";
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
        panel.style.willChange = "height, opacity";

        return new Promise((resolve) => {
            let observer = null;

            const startAnimation = () => {
                if (typeof ResizeObserver !== "undefined") {
                    observer = new ResizeObserver(() => {
                        if (panel.style.height && panel.style.height !== "auto") {
                            panel.style.height = `${panel.scrollHeight}px`;
                        }
                    });
                    observer.observe(panel);
                }

                panel.style.transition = createScenarioPanelTransition();
                panel.style.height = `${panel.scrollHeight}px`;
                panel.style.opacity = "1";

                void waitForScenarioAnimation(panel, () => {
                    observer?.disconnect();
                    panel.style.removeProperty("height");
                    panel.style.removeProperty("opacity");
                    panel.style.removeProperty("overflow");
                    panel.style.removeProperty("transition");
                    panel.style.removeProperty("will-change");
                    resolve();
                });
            };

            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    panel.getBoundingClientRect();
                    startAnimation();
                });
            });
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

    if (hash === "#/progress") {
        return {
            name: "progress",
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

function isSameQuery(left, right) {
    return left.difficulty === right.difficulty
        && left.sort === right.sort
        && left.tags.length === right.tags.length
        && left.tags.every((tag, index) => tag === right.tags[index]);
}

function readCatalogControls(form) {
    const formData = new FormData(form);
    return {
        providerName: normalizeOptionalValue(formData.get("providerName")) ?? DEFAULT_PROVIDER_NAME,
        query: {
            difficulty: normalizeOptionalValue(formData.get("difficulty")),
            tags: formData.getAll("tags").map((tag) => String(tag)).filter(Boolean),
            sort: normalizeOptionalValue(formData.get("sort"))
        }
    };
}

function resolveSharedProviderOptions({
    catalogProviderFactories,
    detailProviderFactories,
    sessionProviderFactories,
    progressProviderFactories
}) {
    const detailProviders = new Set(Object.keys(detailProviderFactories));
    const sessionProviders = new Set(Object.keys(sessionProviderFactories));
    const progressProviders = new Set(Object.keys(progressProviderFactories));

    return Object.keys(catalogProviderFactories)
        .filter((providerName) => detailProviders.has(providerName)
            && sessionProviders.has(providerName)
            && progressProviders.has(providerName))
        .sort();
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
        submission: createInitialSubmissionRequestState(),
        feedbackPanel: createInitialFeedbackPanelState()
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

function createInitialProgressState() {
    return {
        status: "idle",
        summary: null,
        error: null
    };
}

function isEmptyProgressSummary(summary) {
    return (summary?.recentActivity?.length ?? 0) === 0
        && (summary?.items ?? []).every((item) => item.status === "not_started");
}

function createInitialFeedbackPanelState() {
    return {
        status: "idle",
        contextSnapshot: null,
        retryFeedback: null,
        revealedHintCount: 0,
        updatedAt: null
    };
}

function createFeedbackPanelState({
    previousFeedbackPanel = null,
    detail = null,
    scenarioSlug = null,
    preparedSubmission = null,
    status = "idle",
    attemptNumber = 0,
    transportDisposition = "idle",
    correctness = null,
    outcomeCode = null,
    errorMessage = null,
    retryFeedback = null,
    preserveHintReveals = false
}) {
    const previousContext = previousFeedbackPanel?.contextSnapshot ?? null;
    const previousRetryFeedback = previousFeedbackPanel?.retryFeedback ?? null;
    const repositoryContext = detail?.workspace?.repositoryContext ?? null;
    const branches = Array.isArray(repositoryContext?.branches) ? repositoryContext.branches : [];
    const files = Array.isArray(repositoryContext?.files) ? repositoryContext.files : [];
    const currentBranch = branches.find((branch) => branch?.current)?.name
        ?? branches[0]?.name
        ?? previousContext?.currentBranch
        ?? "неизвестно";

    return {
        status,
        contextSnapshot: {
            scenarioSlug: scenarioSlug ?? previousContext?.scenarioSlug ?? null,
            scenarioTitle: detail?.title ?? previousContext?.scenarioTitle ?? scenarioSlug ?? "неизвестно",
            goal: detail?.workspace?.task?.goal
                ?? previousContext?.goal
                ?? "Цель задания недоступна для этого упражнения.",
            currentBranch,
            branchCount: branches.length || previousContext?.branchCount || 0,
            fileCount: files.length || previousContext?.fileCount || 0,
            answerType: preparedSubmission?.answerType ?? previousContext?.answerType ?? "command_text",
            answer: preparedSubmission?.answer ?? previousContext?.answer ?? "",
            attemptNumber: typeof attemptNumber === "number" ? attemptNumber : previousContext?.attemptNumber ?? 0,
            transportDisposition,
            correctness: correctness ?? previousContext?.correctness ?? null,
            outcomeCode: outcomeCode ?? previousContext?.outcomeCode ?? null,
            errorMessage: errorMessage ?? null
        },
        retryFeedback: retryFeedback ?? previousRetryFeedback,
        revealedHintCount: preserveHintReveals ? previousFeedbackPanel?.revealedHintCount ?? 0 : 0,
        updatedAt: new Date().toISOString()
    };
}

function resolveFeedbackPanelStatus(submissionResponse) {
    const retryFeedbackStatus = submissionResponse?.retryFeedback?.status;
    if (typeof retryFeedbackStatus === "string" && retryFeedbackStatus.trim() !== "") {
        return retryFeedbackStatus;
    }

    return submissionResponse?.outcome?.correctness === "correct" ? "resolved" : "guided";
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
            message: toUserFacingRecoveryMessage(error.message, fallbackMessage),
            status: error.status
        };
    }

    if (error instanceof Error) {
        return {
            failureKind: "retryable",
            failureDisposition: "retryable",
            retryable: true,
            code: null,
            message: toUserFacingRecoveryMessage(error.message, fallbackMessage),
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

function toUserFacingRecoveryMessage(message, fallbackMessage) {
    const resolvedMessage = normalizeOptionalValue(message) ?? fallbackMessage;
    return resolvedMessage
        .replace(/Попробуйте\s+\w+\s+provider\.?$/i, "Повторите чуть позже.")
        .replace(/Выберите другой provider/gi, "Выберите другой источник");
}

function captureLaneScrollPositions() {
    return Array.from(document.querySelectorAll(".lesson-lane__body"))
        .map((laneBody) => {
            const laneRoot = laneBody.closest(".lesson-lane");
            const laneName = Array.from(laneRoot?.classList ?? [])
                .find((className) => className.startsWith("lesson-lane--"))
                ?.replace("lesson-lane--", "");

            if (!laneName) {
                return null;
            }

            return {
                laneName,
                scrollTop: laneBody.scrollTop,
                scrollLeft: laneBody.scrollLeft
            };
        })
        .filter(Boolean);
}

function restoreLaneScrollPositions(positions) {
    positions.forEach((position) => {
        const laneBody = document.querySelector(`.lesson-lane--${position.laneName} .lesson-lane__body`);
        if (!laneBody) {
            return;
        }

        laneBody.scrollTop = position.scrollTop;
        laneBody.scrollLeft = position.scrollLeft;
    });
}

function captureSurfaceScrollState(surfaceRoot) {
    const scrollTargets = [
        {
            key: "surface-root",
            element: surfaceRoot
        },
        {
            key: "practice-surface-scroll",
            element: surfaceRoot.querySelector("[data-practice-surface-scroll]")
        },
        {
            key: "practice-repository-viewer",
            element: surfaceRoot.querySelector("[data-repository-context]")
        }
    ];

    return scrollTargets
        .filter((entry) => entry.element)
        .map((entry) => ({
            key: entry.key,
            scrollTop: entry.element.scrollTop,
            scrollLeft: entry.element.scrollLeft
        }));
}

function restoreSurfaceScrollState(surfaceRoot, scrollState) {
    scrollState.forEach((entry) => {
        const element = resolveSurfaceScrollElement(surfaceRoot, entry.key);
        if (!element) {
            return;
        }

        element.scrollTop = entry.scrollTop;
        element.scrollLeft = entry.scrollLeft;
    });
}

function bindSmoothScrollContainers() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    document
        .querySelectorAll(".lesson-lane__body, [data-practice-surface-scroll]")
        .forEach((element) => {
            if (element.dataset.smoothWheelBound === "true") {
                return;
            }

            element.dataset.smoothWheelBound = "true";
            element.addEventListener("wheel", (event) => {
                handleSmoothWheelScroll(event, element);
            }, { passive: false });
        });
}

function handleSmoothWheelScroll(event, element) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey) {
        return;
    }

    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.deltaY === 0) {
        return;
    }

    const maxScrollTop = element.scrollHeight - element.clientHeight;
    if (maxScrollTop <= 0) {
        return;
    }

    const currentTarget = smoothWheelScrollState.get(element)?.targetScrollTop ?? element.scrollTop;
    const nextTarget = clampNumber(
        currentTarget + normalizeWheelDelta(event, element),
        0,
        maxScrollTop
    );

    if (nextTarget === currentTarget) {
        return;
    }

    event.preventDefault();
    animateSmoothWheelScroll(element, nextTarget);
}

function animateSmoothWheelScroll(element, targetScrollTop) {
    const existingState = smoothWheelScrollState.get(element);
    const nextState = existingState ?? {};
    nextState.startScrollTop = element.scrollTop;
    nextState.targetScrollTop = targetScrollTop;
    nextState.startTime = performance.now();

    if (!existingState) {
        nextState.rafId = requestAnimationFrame((timestamp) => {
            stepSmoothWheelScroll(element, timestamp);
        });
    }

    smoothWheelScrollState.set(element, nextState);
}

function stepSmoothWheelScroll(element, timestamp) {
    const state = smoothWheelScrollState.get(element);
    if (!state) {
        return;
    }

    const progress = Math.min((timestamp - state.startTime) / SMOOTH_WHEEL_SCROLL_DURATION_MS, 1);
    const easedProgress = 1 - ((1 - progress) ** 3);
    const nextScrollTop = state.startScrollTop + ((state.targetScrollTop - state.startScrollTop) * easedProgress);
    element.scrollTop = nextScrollTop;

    if (progress < 1 && Math.abs(state.targetScrollTop - nextScrollTop) > 0.5) {
        state.rafId = requestAnimationFrame((nextTimestamp) => {
            stepSmoothWheelScroll(element, nextTimestamp);
        });
        return;
    }

    element.scrollTop = state.targetScrollTop;
    smoothWheelScrollState.delete(element);
}

function normalizeWheelDelta(event, element) {
    switch (event.deltaMode) {
        case WheelEvent.DOM_DELTA_LINE:
            return event.deltaY * 16;
        case WheelEvent.DOM_DELTA_PAGE:
            return event.deltaY * element.clientHeight * 0.9;
        default:
            return event.deltaY;
    }
}

function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function resolveSurfaceScrollElement(surfaceRoot, key) {
    switch (key) {
        case "surface-root":
            return surfaceRoot;
        case "practice-surface-scroll":
            return surfaceRoot.querySelector("[data-practice-surface-scroll]");
        case "practice-repository-viewer":
            return surfaceRoot.querySelector("[data-repository-context]");
        default:
            return null;
    }
}

function escapeSelectorValue(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
        return CSS.escape(value);
    }

    return value.replace(/"/g, '\\"');
}

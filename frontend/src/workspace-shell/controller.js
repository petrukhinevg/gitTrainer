import { SessionTransportError } from "../session/session-transport-error.js";
import {
    bindWorkspaceShellDom,
    captureDraftFieldSnapshot,
    restoreDraftFieldSnapshot
} from "./dom-bindings.js";
import { escapeSelectorValue } from "./dom-helpers.js";
import { createWorkspaceDataOrchestrator } from "./data-orchestration.js";
import {
    createWorkspaceRouteOrchestrator,
    resetRouteScopedWorkspaceState
} from "./route-orchestration.js";
import {
    animateScenarioCollapse,
    animateScenarioExpansion,
    bindSmoothScrollContainers,
    captureLaneScrollPositions,
    NAVIGATION_TOGGLE_ANIMATION_MS,
    captureSurfaceScrollState,
    resetLaneScrollPosition,
    restoreLaneScrollPositions,
    restoreSurfaceScrollState
} from "./scroll-animation.js";
import { redrawNavigationTagConnections } from "./tag-connection-overlay.js";
import {
    renderCatalogWorkspace,
    renderCatalogWorkspaceShell,
    renderCatalogWorkspaceSurfaces
} from "./view.js";

const SAFE_FALLBACK_PROVIDER_NAME = "local-fixture";
const PREFERRED_PROVIDER_ORDER = Object.freeze([
    "backend-api",
    "local-fixture",
    "fixture-unavailable"
]);
const DEFAULT_QUERY = Object.freeze({
    difficulty: null,
    tags: [],
    sort: null
});
const TRANSIENT_NAVIGATION_PANEL_ATTRIBUTES = Object.freeze([
    "data-flow-subtask-enter",
    "data-flow-block-active-tag",
    "data-navigation-toggle-bound",
    "data-route-link-bound"
]);

export function createCatalogWorkspaceController({
    appRoot,
    defaultProviderName = SAFE_FALLBACK_PROVIDER_NAME,
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
        expandingScenarioSlug: null,
        isNavigationCollapsed: false,
        isNavigationCollapsing: false,
        isNavigationExpandedReady: true,
        pinnedNavigationTag: null,
        providerName: defaultProviderName,
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

    let latestSessionBootstrapRequestId = 0;
    let latestSubmissionRequestId = 0;
    const sessionProviders = new Map();
    let navigationAnimationInProgress = false;
    let navigationRevealTimeoutId = 0;
    let navigationCollapseTimeoutId = 0;
    let cleanupPendingNavigationReveal = null;
    let shellMounted = false;
    let pendingLessonScrollReset = false;
    let pendingNavigationSelectionSyncOnly = false;
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
    const dataOrchestrator = createWorkspaceDataOrchestrator({
        state,
        render,
        catalogProviderFactories,
        detailProviderFactories,
        progressProviderFactories,
        cloneQuery,
        toUserFacingRecoveryMessage,
        isEmptyProgressSummary,
        createInitialSubmissionDraftState,
        createInitialSessionState,
        createInitialProgressState,
        ensureExerciseSession,
        invalidateSessionRequests
    });
    const routeOrchestrator = createWorkspaceRouteOrchestrator({
        state,
        render,
        ensureCatalogLoaded: dataOrchestrator.ensureCatalogLoaded,
        loadProgressSummary: dataOrchestrator.loadProgressSummary,
        loadScenarioDetail: dataOrchestrator.loadScenarioDetail,
        ensureExerciseSession,
        onExerciseRouteSelected: (slug) => {
            expandScenario(slug, { loadDetail: false });
        },
        resetRouteScopedState: ({ previousRoute, previousScenarioSlug, previousProviderName }) => {
            resetRouteScopedWorkspaceState({
                state,
                previousRoute,
                previousScenarioSlug,
                previousProviderName,
                createInitialSubmissionDraftState,
                createInitialSessionState,
                createInitialProgressState,
                invalidateSessionRequests
            });
        },
        setPendingLessonScrollReset: (shouldReset) => {
            pendingLessonScrollReset = shouldReset;
        },
        setPendingNavigationSelectionSyncOnly: (shouldSyncSelectionOnly) => {
            pendingNavigationSelectionSyncOnly = shouldSyncSelectionOnly;
        }
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
        await routeOrchestrator.handleRouteChange();
    }

    function render() {
        const selectedCatalogScenario = resolveSelectedCatalogScenario(state, state.catalog.items);
        const isExerciseRoute = state.route === "exercise";
        const isNotFoundRoute = state.route === "not-found";
        const nextRouteKind = isNotFoundRoute ? "not-found" : "workspace";
        const shouldResetLessonScroll = pendingLessonScrollReset;
        const laneScrollPositions = captureLaneScrollPositions({
            excludedLaneNames: shouldResetLessonScroll ? ["lesson"] : []
        });
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

        if (shouldResetLessonScroll) {
            resetLaneScrollPosition("lesson");
        }
        restoreLaneScrollPositions(laneScrollPositions);
        requestAnimationFrame(() => {
            if (shouldResetLessonScroll) {
                resetLaneScrollPosition("lesson");
            }
            restoreLaneScrollPositions(laneScrollPositions);
        });
        pendingLessonScrollReset = false;
        pendingNavigationSelectionSyncOnly = false;
        bindWorkspaceShellDom({
            appRoot,
            state,
            handleRouteChange,
            applyCatalogControls,
            resetCatalogControls,
            toggleNavigationVisibility,
            toggleScenarioExpansion,
            ensureExerciseSession,
            retryLastSubmission,
            restartExerciseSession,
            revealNextRetryHint,
            handleSubmissionDraftInput,
            handleSubmissionDraftSubmit,
            resetSubmissionDraft
        });
        bindSmoothScrollContainers();
    }

    function ensureWorkspaceShellMounted() {
        if (shellMounted) {
            return;
        }

        appRoot.innerHTML = renderCatalogWorkspaceShell();
        shellMounted = true;
    }

    function syncLayoutChrome() {
        const layout = appRoot.querySelector(".lesson-layout");
        if (!layout) {
            return;
        }

        layout.classList.toggle("lesson-layout--navigation-collapsed", state.isNavigationCollapsed);
        layout.classList.toggle("lesson-layout--navigation-collapsing", state.isNavigationCollapsing);
        layout.classList.toggle(
            "lesson-layout--navigation-transitioning",
            !state.isNavigationCollapsed && !state.isNavigationExpandedReady
        );

        const navigationLane = layout.querySelector(".lesson-layout__lane--navigation");
        if (navigationLane instanceof HTMLElement) {
            if (state.isNavigationCollapsed) {
                navigationLane.setAttribute("aria-hidden", "true");
                navigationLane.setAttribute("inert", "");
            } else {
                navigationLane.removeAttribute("aria-hidden");
                navigationLane.removeAttribute("inert");
            }
        }

        const navigationToggle = layout.querySelector("[data-navigation-visibility-toggle]");
        if (navigationToggle instanceof HTMLElement && navigationToggle.tagName === "BUTTON") {
            const actionLabel = state.isNavigationCollapsed ? "Показать левую панель" : "Скрыть левую панель";
            navigationToggle.setAttribute("aria-label", actionLabel);
            navigationToggle.setAttribute("title", actionLabel);
            navigationToggle.setAttribute("aria-expanded", state.isNavigationCollapsed ? "false" : "true");
            navigationToggle.dataset.navigationVisibilityState = state.isNavigationCollapsed ? "collapsed" : "expanded";
            navigationToggle.querySelector("[data-navigation-visibility-label]")?.replaceChildren(
                state.isNavigationCollapsed ? ">" : "<"
            );
        }
    }

    function cancelPendingNavigationReveal() {
        if (navigationRevealTimeoutId) {
            window.clearTimeout(navigationRevealTimeoutId);
            navigationRevealTimeoutId = 0;
        }

        cleanupPendingNavigationReveal?.();
        cleanupPendingNavigationReveal = null;
    }

    function cancelPendingNavigationCollapse() {
        if (!navigationCollapseTimeoutId) {
            return;
        }

        window.clearTimeout(navigationCollapseTimeoutId);
        navigationCollapseTimeoutId = 0;
    }

    function finishNavigationReveal() {
        cancelPendingNavigationReveal();

        if (state.isNavigationCollapsed) {
            return;
        }

        state.isNavigationExpandedReady = true;
        syncLayoutChrome();
        redrawNavigationTagConnections(appRoot);
    }

    function scheduleNavigationReveal() {
        cancelPendingNavigationReveal();
        cancelPendingNavigationCollapse();

        const layout = appRoot.querySelector(".lesson-layout");
        if (!(layout instanceof HTMLElement) || state.isNavigationCollapsed) {
            return;
        }

        const handleTransitionEnd = (event) => {
            if (event.target !== layout || event.propertyName !== "grid-template-columns") {
                return;
            }

            finishNavigationReveal();
        };

        layout.addEventListener("transitionend", handleTransitionEnd);
        cleanupPendingNavigationReveal = () => {
            layout.removeEventListener("transitionend", handleTransitionEnd);
        };
        navigationRevealTimeoutId = window.setTimeout(
            finishNavigationReveal,
            NAVIGATION_TOGGLE_ANIMATION_MS + 40
        );
    }

    function scheduleNavigationCollapseCleanup() {
        cancelPendingNavigationCollapse();
        navigationCollapseTimeoutId = window.setTimeout(() => {
            navigationCollapseTimeoutId = 0;
            state.isNavigationCollapsing = false;
            syncLayoutChrome();
            redrawNavigationTagConnections(appRoot);
        }, NAVIGATION_TOGGLE_ANIMATION_MS + 40);
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
        syncLayoutChrome();
    }

    function patchSurface(surfaceName, nextMarkup, cacheKey = surfaceName) {
        if (renderedSurfaceCache[cacheKey] === nextMarkup) {
            return;
        }

        const target = appRoot.querySelector(`[data-render-surface="${escapeSelectorValue(surfaceName)}"]`);
        if (!target) {
            return;
        }

        if (surfaceName === "navigation" && (
            shouldSyncNavigationSelectionOnly(target)
            || canRetainNavigationSurface(target, nextMarkup)
        )) {
            syncNavigationSurfaceActiveState(target, state);
            renderedSurfaceCache[cacheKey] = nextMarkup;
            return;
        }

        const preservedNavigationTagState = surfaceName === "navigation"
            ? captureNavigationFlowBlockTagState(target)
            : [];
        const previousLaneBody = target.querySelector(".lesson-lane__body");
        const preservedLaneScroll = previousLaneBody
            ? {
                scrollTop: previousLaneBody.scrollTop,
                scrollLeft: previousLaneBody.scrollLeft
            }
            : null;
        const preservedScrollState = captureSurfaceScrollState(target);
        target.innerHTML = nextMarkup;
        if (surfaceName === "navigation") {
            restoreNavigationFlowBlockTagState(target, preservedNavigationTagState);
            syncNavigationSurfaceActiveState(target, state);
        }
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

    function shouldSyncNavigationSelectionOnly(surfaceRoot) {
        if (!pendingNavigationSelectionSyncOnly || !(surfaceRoot instanceof HTMLElement)) {
            return false;
        }

        if (!state.selectedScenarioSlug) {
            return false;
        }

        return Boolean(
            surfaceRoot.querySelector(`[data-scenario-panel="${escapeSelectorValue(state.selectedScenarioSlug)}"]`)
        );
    }

    function resetRenderedSurfaceCache() {
        renderedSurfaceCache.navigation = null;
        renderedSurfaceCache.lesson = null;
        renderedSurfaceCache.practiceViewer = null;
        renderedSurfaceCache.practiceSurface = null;
    }

    async function applyCatalogControls(form) {
        const nextControlsState = readCatalogControls(form, defaultProviderName);
        const providerChanged = nextControlsState.providerName !== state.providerName;
        const queryChanged = !isSameQuery(state.query, nextControlsState.query);

        if (!providerChanged && !queryChanged) {
            return;
        }

        state.providerName = nextControlsState.providerName;
        state.query = nextControlsState.query;

        if (providerChanged) {
            dataOrchestrator.resetProviderScopedState();
        }

        render();
        await dataOrchestrator.reloadActiveRouteData();
    }

    async function resetCatalogControls(form) {
        const defaults = {
            providerName: defaultProviderName,
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
            dataOrchestrator.resetProviderScopedState();
        }

        form.reset();
        render();
        await dataOrchestrator.reloadActiveRouteData();
    }

    function handleSubmissionDraftInput(event) {
        const draftFieldSnapshot = captureDraftFieldSnapshot(event.target);
        const formData = new FormData(event.currentTarget);
        const nextAnswerType = "command_text";
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
        restoreDraftFieldSnapshot(appRoot, draftFieldSnapshot);
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
            answerType: "command_text",
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

    function resetSubmissionRequestState() {
        state.session.submission = createInitialSubmissionRequestState();
    }

    function invalidateSessionRequests() {
        ++latestSessionBootstrapRequestId;
        ++latestSubmissionRequestId;
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

    return {
        bootstrap
    };

    function expandScenario(slug, { loadDetail = true } = {}) {
        if (!slug || state.expandedScenarioSlugs.includes(slug)) {
            return;
        }

        state.expandedScenarioSlugs = [...state.expandedScenarioSlugs, slug];
        if (loadDetail) {
            void dataOrchestrator.loadScenarioDetail(slug, { syncSelected: false });
        }
    }

    function collapseScenario(slug) {
        state.expandedScenarioSlugs = state.expandedScenarioSlugs.filter((item) => item !== slug);
        if (state.expandingScenarioSlug === slug) {
            state.expandingScenarioSlug = null;
        }
    }

    function syncNavigationSurfaceCacheFromDom() {
        const navigationSurface = appRoot.querySelector('[data-render-surface="navigation"]');
        renderedSurfaceCache.navigation = navigationSurface ? navigationSurface.innerHTML : null;
    }

    function syncCollapsedScenarioNavigationNode(slug) {
        const toggleButton = appRoot.querySelector(`[data-scenario-toggle="${escapeSelectorValue(slug)}"]`);
        if (toggleButton) {
            toggleButton.setAttribute("aria-expanded", "false");
            toggleButton.querySelector(".flow-block__indicator")?.replaceChildren(">");
        }

        appRoot.querySelector(`[data-scenario-panel="${escapeSelectorValue(slug)}"]`)?.remove();
        syncNavigationSurfaceCacheFromDom();
    }

    async function toggleScenarioExpansion(slug) {
        if (navigationAnimationInProgress) {
            return;
        }

        if (state.expandedScenarioSlugs.includes(slug)) {
            navigationAnimationInProgress = true;

            try {
                await animateScenarioCollapse(appRoot, slug, {
                    onFrame: () => {
                        redrawNavigationTagConnections(appRoot, { preserveAnimation: true });
                    }
                });
                collapseScenario(slug);
                syncCollapsedScenarioNavigationNode(slug);
                redrawNavigationTagConnections(appRoot);
            } finally {
                navigationAnimationInProgress = false;
            }

            return;
        }

        navigationAnimationInProgress = true;
        state.expandingScenarioSlug = slug;
        expandScenario(slug, { loadDetail: false });
        render();

        try {
            await Promise.all([
                animateScenarioExpansion(appRoot, slug, {
                    onFrame: () => {
                        redrawNavigationTagConnections(appRoot, { preserveAnimation: true });
                    }
                }),
                dataOrchestrator.loadScenarioDetail(slug, { syncSelected: false })
            ]);
            redrawNavigationTagConnections(appRoot);
        } finally {
            if (state.expandingScenarioSlug === slug) {
                state.expandingScenarioSlug = null;
            }
            navigationAnimationInProgress = false;
        }
    }

    function toggleNavigationVisibility() {
        const layout = appRoot.querySelector(".lesson-layout");
        const navigationLane = layout?.querySelector(".lesson-layout__lane--navigation");
        const navigationToggle = layout?.querySelector("[data-navigation-visibility-toggle]");
        const focusedInsideNavigation = navigationLane instanceof HTMLElement && navigationLane.contains(document.activeElement);

        if (state.isNavigationCollapsed) {
            cancelPendingNavigationCollapse();
            state.isNavigationCollapsed = false;
            state.isNavigationCollapsing = false;
            state.isNavigationExpandedReady = false;
            syncLayoutChrome();
            scheduleNavigationReveal();
            redrawNavigationTagConnections(appRoot);
        } else {
            cancelPendingNavigationReveal();
            state.isNavigationCollapsed = true;
            state.isNavigationCollapsing = true;
            state.isNavigationExpandedReady = true;
            syncLayoutChrome();
            scheduleNavigationCollapseCleanup();
        }

        if (
            state.isNavigationCollapsed
            && focusedInsideNavigation
            && navigationToggle instanceof HTMLElement
            && navigationToggle.tagName === "BUTTON"
        ) {
            navigationToggle.focus({ preventScroll: true });
        }
    }
}

export function captureNavigationFlowBlockTagState(surfaceRoot) {
    if (!(surfaceRoot instanceof HTMLElement)) {
        return [];
    }

    return Array.from(surfaceRoot.querySelectorAll("[data-flow-block-active-tag]"))
        .map((element) => {
            if (!(element instanceof HTMLElement)) {
                return null;
            }

            const tag = element.dataset.flowBlockActiveTag;
            if (!tag) {
                return null;
            }

            if (element.dataset.scenarioToggle) {
                return {
                    kind: "scenario-toggle",
                    key: element.dataset.scenarioToggle,
                    tag
                };
            }

            const href = element.getAttribute("href");
            if (href) {
                return {
                    kind: "href",
                    key: href,
                    tag
                };
            }

            return null;
        })
        .filter(Boolean);
}

export function restoreNavigationFlowBlockTagState(surfaceRoot, entries) {
    if (!(surfaceRoot instanceof HTMLElement) || !Array.isArray(entries) || entries.length === 0) {
        return;
    }

    entries.forEach((entry) => {
        if (!entry?.kind || !entry.key || !entry.tag) {
            return;
        }

        let element = null;
        if (entry.kind === "scenario-toggle") {
            element = surfaceRoot.querySelector(`[data-scenario-toggle="${escapeSelectorValue(entry.key)}"]`);
        } else if (entry.kind === "href") {
            element = surfaceRoot.querySelector(`[href="${escapeSelectorValue(entry.key)}"]`);
        }

        if (element instanceof HTMLElement) {
            element.dataset.flowBlockActiveTag = entry.tag;
        }
    });
}

function canRetainNavigationSurface(surfaceRoot, nextMarkup) {
    if (!(surfaceRoot instanceof HTMLElement)) {
        return false;
    }

    return serializeNormalizedNavigationMarkup(surfaceRoot.innerHTML)
        === serializeNormalizedNavigationMarkup(nextMarkup);
}

function serializeNormalizedNavigationMarkup(markup) {
    const template = document.createElement("template");
    template.innerHTML = markup;
    normalizeNavigationMarkup(template.content);
    return template.innerHTML;
}

function normalizeNavigationMarkup(root) {
    const elements = Array.from(root.querySelectorAll("*"));

    elements.forEach((element) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }

        element.classList.remove("flow-block--active");
        TRANSIENT_NAVIGATION_PANEL_ATTRIBUTES.forEach((attributeName) => {
            element.removeAttribute(attributeName);
        });

        if (element.style.getPropertyValue("--flow-subtask-enter-index")) {
            element.style.removeProperty("--flow-subtask-enter-index");
            if (!element.getAttribute("style")?.trim()) {
                element.removeAttribute("style");
            }
        }
    });
}

function syncNavigationSurfaceActiveState(surfaceRoot, state) {
    if (!(surfaceRoot instanceof HTMLElement)) {
        return;
    }

    syncNavigationRouteShortcutState(surfaceRoot, state);
    syncNavigationScenarioToggleState(surfaceRoot, state);
    syncNavigationScenarioPanelActiveState(surfaceRoot, state);
}

function syncNavigationRouteShortcutState(surfaceRoot, state) {
    const routeShortcutStates = [
        ["#/catalog", state.route === "catalog"],
        ["#/progress", state.route === "progress"]
    ];

    routeShortcutStates.forEach(([href, isActive]) => {
        const link = surfaceRoot.querySelector(`[href="${escapeSelectorValue(href)}"]`);
        if (link instanceof HTMLElement) {
            link.classList.toggle("flow-block--active", isActive);
        }
    });
}

function syncNavigationScenarioToggleState(surfaceRoot, state) {
    Array.from(surfaceRoot.querySelectorAll("[data-scenario-toggle]")).forEach((button) => {
        if (!(button instanceof HTMLElement)) {
            return;
        }

        button.classList.toggle("flow-block--active", button.dataset.scenarioToggle === state.selectedScenarioSlug);
    });
}

function syncNavigationScenarioPanelActiveState(surfaceRoot, state) {
    Array.from(surfaceRoot.querySelectorAll("[data-scenario-panel]")).forEach((panel) => {
        if (!(panel instanceof HTMLElement)) {
            return;
        }

        const scenarioSlug = panel.dataset.scenarioPanel;
        const isActiveScenario = Boolean(scenarioSlug) && scenarioSlug === state.selectedScenarioSlug;

        Array.from(panel.querySelectorAll("[data-scenario-focus]")).forEach((link) => {
            if (!(link instanceof HTMLElement)) {
                return;
            }

            const focusId = normalizeOptionalValue(link.dataset.scenarioFocus);
            const isOverviewLink = focusId === "overview";
            const shouldBeActive = isActiveScenario
                && (
                    state.selectedFocus === focusId
                    || (isOverviewLink && state.selectedFocus === null)
                );

            link.classList.toggle("flow-block--active", shouldBeActive);
        });
    });
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

function readCatalogControls(form, defaultProviderName) {
    const formData = new FormData(form);
    return {
        providerName: normalizeOptionalValue(formData.get("providerName")) ?? defaultProviderName,
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
        .sort((left, right) => compareProviderPriority(left, right));
}

function compareProviderPriority(left, right) {
    const leftIndex = PREFERRED_PROVIDER_ORDER.indexOf(left);
    const rightIndex = PREFERRED_PROVIDER_ORDER.indexOf(right);

    if (leftIndex === -1 && rightIndex === -1) {
        return left.localeCompare(right);
    }

    if (leftIndex === -1) {
        return 1;
    }

    if (rightIndex === -1) {
        return -1;
    }

    return leftIndex - rightIndex;
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
        .replace(/local-fixture/gi, "локальные фикстуры")
        .replace(/fixture-unavailable/gi, "недоступный источник")
        .replace(/Попробуйте\s+\w+\s+provider\.?$/i, "Повторите чуть позже.")
        .replace(/Выберите другой provider/gi, "Выберите другой источник")
        .replace(/provider/gi, "источник");
}

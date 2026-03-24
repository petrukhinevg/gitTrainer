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
    parseWorkspaceRoute,
    resetRouteScopedWorkspaceState
} from "./route-orchestration.js";
import {
    animateScenarioCollapse,
    animateScenarioExpansion,
    bindSmoothScrollContainers,
    captureLaneScrollPositions,
    captureSurfaceScrollState,
    NAVIGATION_LAYOUT_TOGGLE_ANIMATION_MS,
    releaseCollapsedScenarioGap,
    resolveScenarioSubtaskEnterAnimationMs,
    resetLaneScrollPosition,
    restoreLaneScrollPositions,
    restoreSurfaceScrollState
} from "./scroll-animation.js";
import { redrawNavigationActiveMarker } from "./navigation-active-marker.js";
import { resolveNavigationActiveMarkerTarget } from "./navigation-active-marker.js";
import { syncNavigationMarkerTarget } from "./navigation-active-marker.js";
import { PANEL_LAYOUT_MODE, resolvePanelLayoutMode } from "./panel-layout-config.js";
import { redrawNavigationTagConnections } from "./tag-connection-overlay.js";
import {
    renderCatalogWorkspace,
    renderCatalogWorkspaceShell,
    renderCatalogWorkspaceSurfaces
} from "./view.js";
import { isSandboxShortcutActive, SANDBOX_ROUTE_HASH } from "./sandbox-route.js";

const SAFE_FALLBACK_PROVIDER_NAME = "backend-api";
const PREFERRED_PROVIDER_ORDER = Object.freeze([
    "backend-api"
]);
const DEFAULT_QUERY = Object.freeze({
    difficulty: null,
    tags: [],
    sort: null
});
const TRANSIENT_NAVIGATION_PANEL_ATTRIBUTES = Object.freeze([
    "data-flow-subtask-enter",
    "data-flow-subtask-active-tag",
    "data-flow-subtask-tag-state-restored",
    "data-flow-subtask-shift-animating",
    "data-flow-block-active-tag",
    "data-flow-block-tag-state-restored",
    "data-navigation-marker-target",
    "data-scenario-animating",
    "data-tag-connection-collapsing",
    "data-tag-legend-bound",
    "data-navigation-collapse-all-bound",
    "data-navigation-toggle-bound",
    "data-route-link-bound"
]);
const FLOW_BLOCK_TAG_STATE_RESTORED_ATTRIBUTE = "data-flow-block-tag-state-restored";
const FLOW_SUBTASK_TAG_STATE_RESTORED_ATTRIBUTE = "data-flow-subtask-tag-state-restored";

export function createCatalogWorkspaceController({
    appRoot,
    defaultProviderName = SAFE_FALLBACK_PROVIDER_NAME,
    catalogProviderFactories,
    detailProviderFactories,
    sessionProviderFactories,
    progressProviderFactories,
    tagOptions
}) {
    const initialPanelLayoutMode = resolvePanelLayoutMode();
    const state = {
        route: "catalog",
        selectedScenarioSlug: null,
        selectedFocus: null,
        expandedScenarioSlugs: [],
        expandingScenarioSlugs: [],
        collapsedNavigationScenarioSnapshot: null,
        isNavigationCollapsed: false,
        isCompactNavigationVisible: false,
        isNavigationEffectivelyCollapsed: initialPanelLayoutMode === PANEL_LAYOUT_MODE.NAVIGATION_COLLAPSED,
        isNavigationCollapsing: false,
        isNavigationExpandedReady: true,
        panelLayoutMode: initialPanelLayoutMode,
        pinnedNavigationTag: null,
        heldNavigationTag: null,
        heldNavigationTagExpandedSnapshot: null,
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
            error: null,
            scenarioSlug: null
        },
        detailCache: {
        }
    };

    let latestSessionBootstrapRequestId = 0;
    let latestSubmissionRequestId = 0;
    const sessionProviders = new Map();
    const activeNavigationAnimationSlugs = new Set();
    const scenarioSubtaskEnterCleanupTimeoutIds = new Map();
    let navigationRevealTimeoutId = 0;
    let navigationCollapseTimeoutId = 0;
    let cleanupPendingNavigationReveal = null;
    let shellMounted = false;
    let pendingLessonScrollReset = false;
    let pendingNavigationSelectionSyncOnly = false;
    let pendingDraftFieldSnapshot = null;
    let isTogglingAllNavigationScenarios = false;
    let renderedRouteKind = null;
    let navigationMarkerDragOperation = Promise.resolve();
    const renderedSurfaceCache = {
        navigation: null,
        lesson: null,
        practiceViewer: null,
        practiceSurface: null
    };
    const navigationMarkerDragState = {
        active: false
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
        window.addEventListener("resize", handleViewportResize);
        syncResponsivePanelLayoutState();

        if (!window.location.hash) {
            window.location.hash = "#/catalog";
            return;
        }

        await handleRouteChange();
    }

    async function handleRouteChange() {
        await routeOrchestrator.handleRouteChange();
    }

    function handleViewportResize() {
        const responsiveLayoutState = syncResponsivePanelLayoutState();

        if (responsiveLayoutState.hasLayoutChanged) {
            syncLayoutChrome();
        }

        if (responsiveLayoutState.shouldScheduleNavigationReveal) {
            scheduleNavigationReveal();
        }

        redrawNavigationActiveMarker(appRoot);
        redrawNavigationTagConnections(appRoot);
    }

    function render() {
        syncResponsivePanelLayoutState();
        const activeDraftFieldSnapshot = captureDraftFieldSnapshot(document.activeElement);
        if (activeDraftFieldSnapshot) {
            pendingDraftFieldSnapshot = activeDraftFieldSnapshot;
        }

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
            handleNavigationMarkerDragStart,
            handleNavigationMarkerDragSelection,
            handleNavigationMarkerDragEnd,
            applyCatalogControls,
            resetCatalogControls,
            toggleNavigationVisibility,
            toggleScenarioExpansion,
            toggleAllNavigationScenarios,
            toggleNavigationTagPin,
            beginNavigationTagHold,
            endNavigationTagHold,
            ensureExerciseSession,
            retryLastSubmission,
            restartExerciseSession,
            revealNextRetryHint,
            handleSubmissionDraftInput,
            handleSubmissionDraftSubmit,
            resetSubmissionDraft
        });
        bindSmoothScrollContainers();

        if (pendingDraftFieldSnapshot && restoreDraftFieldSnapshot(appRoot, pendingDraftFieldSnapshot)) {
            pendingDraftFieldSnapshot = null;
        }
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

        const isPracticeHidden = state.route !== "exercise";
        const isNavigationCollapsed = state.isNavigationEffectivelyCollapsed;
        const isCompactTwoPanelLayout = state.panelLayoutMode === PANEL_LAYOUT_MODE.NAVIGATION_COLLAPSED;
        const isNavigationToggleVisible = state.panelLayoutMode !== PANEL_LAYOUT_MODE.STACKED;
        const isCompactNavigationVisible = isCompactTwoPanelLayout && state.isCompactNavigationVisible;

        layout.classList.toggle("lesson-layout--navigation-collapsed", isNavigationCollapsed);
        layout.classList.toggle("lesson-layout--navigation-collapsing", state.isNavigationCollapsing);
        layout.classList.toggle(
            "lesson-layout--navigation-transitioning",
            !isNavigationCollapsed && !state.isNavigationExpandedReady
        );
        layout.classList.toggle("lesson-layout--compact-two-panel", isCompactTwoPanelLayout);
        layout.classList.toggle("lesson-layout--compact-navigation-visible", isCompactNavigationVisible);
        layout.classList.toggle("lesson-layout--practice-hidden", isPracticeHidden);

        const navigationLane = layout.querySelector(".lesson-layout__lane--navigation");
        if (navigationLane instanceof HTMLElement) {
            if (isNavigationCollapsed) {
                navigationLane.setAttribute("aria-hidden", "true");
                navigationLane.setAttribute("inert", "");
            } else {
                navigationLane.removeAttribute("aria-hidden");
                navigationLane.removeAttribute("inert");
            }
        }

        const lessonLane = layout.querySelector(".lesson-layout__lane--lesson");
        if (lessonLane instanceof HTMLElement) {
            if (isCompactNavigationVisible) {
                lessonLane.setAttribute("aria-hidden", "true");
                lessonLane.setAttribute("inert", "");
            } else {
                lessonLane.removeAttribute("aria-hidden");
                lessonLane.removeAttribute("inert");
            }
        }

        const practiceLane = layout.querySelector(".lesson-layout__lane--practice");
        if (practiceLane instanceof HTMLElement) {
            if (isPracticeHidden) {
                practiceLane.setAttribute("aria-hidden", "true");
                practiceLane.setAttribute("inert", "");
            } else {
                practiceLane.removeAttribute("aria-hidden");
                practiceLane.removeAttribute("inert");
            }
        }

        const navigationToggle = layout.querySelector("[data-navigation-visibility-toggle]");
        if (navigationToggle instanceof HTMLElement && navigationToggle.tagName === "BUTTON") {
            const actionLabel = resolveNavigationToggleActionLabel();
            navigationToggle.setAttribute("aria-label", actionLabel);
            navigationToggle.setAttribute("title", actionLabel);
            navigationToggle.setAttribute("aria-expanded", isNavigationCollapsed ? "false" : "true");
            navigationToggle.dataset.navigationVisibilityState = isNavigationCollapsed ? "collapsed" : "expanded";
            navigationToggle.hidden = !isNavigationToggleVisible;
            navigationToggle.toggleAttribute("aria-hidden", !isNavigationToggleVisible);
            navigationToggle.querySelector("[data-navigation-visibility-label]")?.replaceChildren(
                resolveNavigationToggleLabel()
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

        if (state.isNavigationEffectivelyCollapsed) {
            return;
        }

        state.isNavigationExpandedReady = true;
        syncLayoutChrome();
        redrawNavigationActiveMarker(appRoot);
        redrawNavigationTagConnections(appRoot);
    }

    function scheduleNavigationReveal() {
        cancelPendingNavigationReveal();
        cancelPendingNavigationCollapse();

        const layout = appRoot.querySelector(".lesson-layout");
        if (!(layout instanceof HTMLElement) || state.isNavigationEffectivelyCollapsed) {
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
            NAVIGATION_LAYOUT_TOGGLE_ANIMATION_MS + 40
        );
    }

    function scheduleNavigationCollapseCleanup() {
        cancelPendingNavigationCollapse();
        navigationCollapseTimeoutId = window.setTimeout(() => {
            navigationCollapseTimeoutId = 0;
            state.isNavigationCollapsing = false;
            syncLayoutChrome();
            redrawNavigationActiveMarker(appRoot);
            redrawNavigationTagConnections(appRoot);
        }, NAVIGATION_LAYOUT_TOGGLE_ANIMATION_MS + 40);
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
        const comparableMarkup = normalizeSurfaceMarkupForCache(surfaceName, nextMarkup);
        const shouldAutoScrollCommandHistory = shouldAutoScrollWorkspaceCommandHistory(surfaceName, nextMarkup);

        if (renderedSurfaceCache[cacheKey] === comparableMarkup) {
            return;
        }

        const target = appRoot.querySelector(`[data-render-surface="${escapeSelectorValue(surfaceName)}"]`);
        if (!target) {
            return;
        }

        if (surfaceName === "navigation" && (
            shouldSyncNavigationSelectionOnly(target)
            || canRetainNavigationSurface(target, nextMarkup)
            || tryPatchNavigationScenarioNodes(target, nextMarkup)
        )) {
            syncNavigationSurfaceActiveState(target, state);
            renderedSurfaceCache[cacheKey] = comparableMarkup;
            return;
        }

        if (surfaceName === "practice-viewer" && tryPatchPracticeViewerSurface(target, nextMarkup, {
            shouldAutoScrollCommandHistory
        })) {
            renderedSurfaceCache[cacheKey] = comparableMarkup;
            return;
        }

        const preservedNavigationTagState = surfaceName === "navigation"
            ? captureNavigationFlowBlockTagState(target)
            : [];
        const preservedNavigationSubtaskGroupTagState = surfaceName === "navigation"
            ? captureNavigationSubtaskGroupTagState(target)
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
            restoreNavigationSubtaskGroupTagState(target, preservedNavigationSubtaskGroupTagState);
            scheduleNavigationTagStateRestoreCleanup(target);
            syncNavigationSurfaceActiveState(target, state);
        }
        const nextLaneBody = target.querySelector(".lesson-lane__body");
        if (nextLaneBody && preservedLaneScroll) {
            nextLaneBody.scrollTop = preservedLaneScroll.scrollTop;
            nextLaneBody.scrollLeft = preservedLaneScroll.scrollLeft;
        }
        restoreSurfaceScrollState(target, preservedScrollState);
        if (shouldAutoScrollCommandHistory) {
            scrollWorkspaceCommandHistoryToBottom(target);
        }
        requestAnimationFrame(() => {
            const deferredLaneBody = target.querySelector(".lesson-lane__body");
            if (deferredLaneBody && preservedLaneScroll) {
                deferredLaneBody.scrollTop = preservedLaneScroll.scrollTop;
                deferredLaneBody.scrollLeft = preservedLaneScroll.scrollLeft;
            }

            restoreSurfaceScrollState(target, preservedScrollState);
            if (shouldAutoScrollCommandHistory) {
                scrollWorkspaceCommandHistoryToBottom(target);
            }
        });
        renderedSurfaceCache[cacheKey] = comparableMarkup;
    }

    function normalizeSurfaceMarkupForCache(surfaceName, markup) {
        if (surfaceName !== "practice-viewer") {
            return markup;
        }

        return markup.replace(
            /(<textarea\b[^>]*name="answer"[^>]*>)[\s\S]*?(<\/textarea>)/,
            "$1$2"
        );
    }

    function shouldAutoScrollWorkspaceCommandHistory(surfaceName, markup) {
        if (surfaceName !== "practice-viewer" || state.route !== "exercise") {
            return false;
        }

        if (!String(markup ?? "").includes("data-workspace-command-history")) {
            return false;
        }

        return state.session.commandHistory.length > 0 || state.submissionDraft.validationError !== null;
    }

    function scrollWorkspaceCommandHistoryToBottom(surfaceRoot) {
        const historyPanel = surfaceRoot.querySelector(".workspace-terminal__history");
        if (!(historyPanel instanceof HTMLElement)) {
            return;
        }

        const nextScrollTop = Math.max(0, historyPanel.scrollHeight - historyPanel.clientHeight);
        historyPanel.scrollTop = nextScrollTop;
    }

    function tryPatchPracticeViewerSurface(target, nextMarkup, { shouldAutoScrollCommandHistory }) {
        const nextRoot = parseMarkupRoot(nextMarkup);
        const currentViewerRoot = target.firstElementChild;
        const nextViewerRoot = nextRoot?.firstElementChild;
        if (!(currentViewerRoot instanceof HTMLElement) || !(nextViewerRoot instanceof HTMLElement)) {
            return false;
        }

        const currentWorkspace = currentViewerRoot.querySelector("[data-repository-workspace-visual]");
        const nextWorkspace = nextViewerRoot.querySelector("[data-repository-workspace-visual]");
        const currentTerminal = currentViewerRoot.querySelector(".workspace-terminal");
        const nextTerminal = nextViewerRoot.querySelector(".workspace-terminal");
        if (
            !(currentWorkspace instanceof HTMLElement)
            || !(nextWorkspace instanceof HTMLElement)
            || !(currentTerminal instanceof HTMLElement)
            || !(nextTerminal instanceof HTMLElement)
        ) {
            return false;
        }

        patchPracticeViewerWorkspace(currentViewerRoot, nextViewerRoot);
        patchPracticeViewerTerminal(currentViewerRoot, nextViewerRoot, { shouldAutoScrollCommandHistory });
        return true;
    }

    function patchPracticeViewerWorkspace(currentViewerRoot, nextViewerRoot) {
        const currentWorkspace = currentViewerRoot.querySelector("[data-repository-workspace-visual]");
        const nextWorkspace = nextViewerRoot.querySelector("[data-repository-workspace-visual]");
        if (!(currentWorkspace instanceof HTMLElement) || !(nextWorkspace instanceof HTMLElement)) {
            return;
        }

        if (!currentWorkspace.isEqualNode(nextWorkspace)) {
            currentWorkspace.replaceWith(nextWorkspace.cloneNode(true));
        }
    }

    function patchPracticeViewerTerminal(currentViewerRoot, nextViewerRoot, { shouldAutoScrollCommandHistory }) {
        const currentTerminal = currentViewerRoot.querySelector(".workspace-terminal");
        const nextTerminal = nextViewerRoot.querySelector(".workspace-terminal");
        if (!(currentTerminal instanceof HTMLElement) || !(nextTerminal instanceof HTMLElement)) {
            return;
        }

        currentTerminal.className = nextTerminal.className;
        syncElementAttributes(currentTerminal, nextTerminal, ["class"]);

        const currentHeader = currentTerminal.querySelector("[data-workspace-terminal-header]");
        const nextHeader = nextTerminal.querySelector("[data-workspace-terminal-header]");
        if (currentHeader instanceof HTMLElement && nextHeader instanceof HTMLElement && !currentHeader.isEqualNode(nextHeader)) {
            currentHeader.replaceWith(nextHeader.cloneNode(true));
        }

        const currentHistory = currentTerminal.querySelector(".workspace-terminal__history");
        const nextHistory = nextTerminal.querySelector(".workspace-terminal__history");
        if (currentHistory instanceof HTMLElement && nextHistory instanceof HTMLElement) {
            patchWorkspaceTerminalHistory(currentHistory, nextHistory);
        }

        const currentForm = currentTerminal.querySelector("[data-submission-draft-form]");
        const nextForm = nextTerminal.querySelector("[data-submission-draft-form]");
        if (currentForm instanceof HTMLElement && nextForm instanceof HTMLElement && !currentForm.isEqualNode(nextForm)) {
            currentForm.replaceWith(nextForm.cloneNode(true));
        }

        if (shouldAutoScrollCommandHistory) {
            scrollWorkspaceCommandHistoryToBottom(currentViewerRoot);
        }
    }

    function patchWorkspaceTerminalHistory(currentHistory, nextHistory) {
        const currentByTranscriptId = new Map(
            Array.from(currentHistory.children)
                .filter((element) => element instanceof HTMLElement)
                .map((element) => [element.getAttribute("data-workspace-transcript-id"), element])
        );
        const retainedNodes = new Set();
        const nextChildren = Array.from(nextHistory.children).filter((element) => element instanceof HTMLElement);

        nextChildren.forEach((nextChild, index) => {
            const transcriptId = nextChild.getAttribute("data-workspace-transcript-id");
            const currentChild = transcriptId ? currentByTranscriptId.get(transcriptId) : null;

            let desiredNode;
            if (currentChild instanceof HTMLElement) {
                desiredNode = currentChild;
                if (!currentChild.isEqualNode(nextChild)) {
                    const replacementNode = nextChild.cloneNode(true);
                    currentChild.replaceWith(replacementNode);
                    desiredNode = replacementNode;
                }
            } else {
                desiredNode = nextChild.cloneNode(true);
            }

            retainedNodes.add(desiredNode);
            const referenceNode = currentHistory.children[index] ?? null;
            if (referenceNode !== desiredNode) {
                currentHistory.insertBefore(desiredNode, referenceNode);
            }
        });

        Array.from(currentHistory.children)
            .filter((child) => child instanceof HTMLElement && !retainedNodes.has(child))
            .forEach((child) => child.remove());
    }

    function parseMarkupRoot(markup) {
        const template = document.createElement("template");
        template.innerHTML = markup;
        return template.content;
    }

    function syncElementAttributes(targetElement, sourceElement, excludedAttributeNames = []) {
        const excluded = new Set(excludedAttributeNames);
        const targetAttributes = Array.from(targetElement.attributes).map((attribute) => attribute.name);
        targetAttributes.forEach((attributeName) => {
            if (!excluded.has(attributeName) && !sourceElement.hasAttribute(attributeName)) {
                targetElement.removeAttribute(attributeName);
            }
        });

        Array.from(sourceElement.attributes).forEach((attribute) => {
            if (!excluded.has(attribute.name)) {
                targetElement.setAttribute(attribute.name, attribute.value);
            }
        });
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
        const draftField = event.currentTarget.querySelector('[name="answer"]');
        if (
            draftField instanceof HTMLInputElement
            || draftField instanceof HTMLTextAreaElement
        ) {
            draftField.value = "";
            draftField.setSelectionRange(0, 0, "none");
        }

        pendingDraftFieldSnapshot = {
            name: "answer",
            selectionStart: 0,
            selectionEnd: 0,
            selectionDirection: "none"
        };
        state.submissionDraft.answerType = preparedSubmission.answerType;
        state.submissionDraft.answer = "";
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
        pendingDraftFieldSnapshot = {
            name: "answer",
            selectionStart: 0,
            selectionEnd: 0,
            selectionDirection: "none"
        };
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
        state.session.commandHistory = [];
        state.session.workspacePlayback = {
            ...createInitialWorkspacePlaybackState(),
            status: "booting",
            currentContext: null,
            updatedAt: new Date().toISOString()
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
            state.session.workspacePlayback = {
                status: "ready",
                currentContext: response?.workspace?.repositoryContext ?? null,
                previousContext: null,
                command: null,
                outcomeCorrectness: null,
                updatedAt: new Date().toISOString()
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
            state.session.workspacePlayback = {
                ...state.session.workspacePlayback,
                status: `${normalizedFailure.failureKind}-error`,
                command: null,
                outcomeCorrectness: null,
                updatedAt: new Date().toISOString()
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
        const historyEntryId = `command-${requestId}`;
        const activeRepositoryContext = state.session.submission.response?.workspace?.repositoryContext
            ?? state.session.bootstrap.response?.workspace?.repositoryContext
            ?? state.detail.data?.workspace?.repositoryContext
            ?? null;
        state.session.submission = {
            status: "pending",
            response: null,
            error: null,
            lastPayload: preparedSubmission
        };
        state.session.workspacePlayback = {
            status: "running",
            currentContext: activeRepositoryContext,
            previousContext: activeRepositoryContext,
            command: preparedSubmission.answer,
            outcomeCorrectness: null,
            updatedAt: new Date().toISOString()
        };
        state.session.commandHistory = [
            ...state.session.commandHistory,
            createCommandHistoryEntry(historyEntryId, preparedSubmission)
        ];
        state.session.feedbackPanel = createFeedbackPanelState({
            previousFeedbackPanel: state.session.feedbackPanel,
            detail: state.detail.data,
            repositoryContext: activeRepositoryContext,
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
            state.session.workspacePlayback = {
                status: "updated",
                currentContext: response?.workspace?.repositoryContext ?? activeRepositoryContext,
                previousContext: activeRepositoryContext,
                command: preparedSubmission.answer,
                outcomeCorrectness: response?.outcome?.correctness ?? null,
                updatedAt: new Date().toISOString()
            };
            state.session.commandHistory = updateCommandHistoryEntry(
                state.session.commandHistory,
                historyEntryId,
                {
                    status: resolveCommandHistoryStatus(response?.outcome?.correctness),
                    summary: resolveCommandHistorySummary(preparedSubmission.answer, response?.outcome?.correctness),
                    terminalOutput: response?.terminalOutput ?? null,
                    completedAt: response?.submittedAt ?? new Date().toISOString()
                }
            );
            if (response?.outcome?.correctness === "correct") {
                state.session.commandHistory = [
                    ...state.session.commandHistory,
                    createSystemCommandHistoryEntry(
                        `system-${requestId}`,
                        resolveCorrectStateConsoleMessage(response?.workspace?.repositoryContext),
                        response?.submittedAt ?? new Date().toISOString()
                    )
                ];
            }
            state.session.feedbackPanel = createFeedbackPanelState({
                previousFeedbackPanel: state.session.feedbackPanel,
                detail: state.detail.data,
                repositoryContext: response?.workspace?.repositoryContext ?? null,
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
            state.session.workspacePlayback = {
                status: `${normalizedFailure.failureKind}-error`,
                currentContext: activeRepositoryContext,
                previousContext: activeRepositoryContext,
                command: preparedSubmission.answer,
                outcomeCorrectness: null,
                updatedAt: new Date().toISOString()
            };
            state.session.commandHistory = updateCommandHistoryEntry(
                state.session.commandHistory,
                historyEntryId,
                {
                    status: "failed",
                    summary: normalizedFailure.message,
                    terminalOutput: {
                        stdout: "",
                        stderr: normalizedFailure.message
                    },
                    completedAt: new Date().toISOString()
                }
            );
            state.session.feedbackPanel = createFeedbackPanelState({
                previousFeedbackPanel: state.session.feedbackPanel,
                detail: state.detail.data,
                repositoryContext: activeRepositoryContext,
                scenarioSlug: state.selectedScenarioSlug,
                preparedSubmission,
                status: "request-failure",
                attemptNumber: state.session.feedbackPanel?.contextSnapshot?.attemptNumber ?? 0,
                transportDisposition: normalizedFailure.failureKind,
                errorMessage: "Подробности ошибки уже показаны в консоли выше.",
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

    function queueNavigationMarkerDragOperation(operation) {
        navigationMarkerDragOperation = navigationMarkerDragOperation.then(operation, operation);
        return navigationMarkerDragOperation;
    }

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
        state.expandingScenarioSlugs = state.expandingScenarioSlugs.filter((item) => item !== slug);
    }

    function syncNavigationSurfaceCacheFromDom() {
        const navigationSurface = appRoot.querySelector('[data-render-surface="navigation"]');
        renderedSurfaceCache.navigation = navigationSurface ? navigationSurface.innerHTML : null;
    }

    function syncCollapsedScenarioNavigationNode(slug) {
        cancelScenarioSubtaskEnterStateCleanup(slug);
        const toggleButton = appRoot.querySelector(`[data-scenario-toggle="${escapeSelectorValue(slug)}"]`);
        if (toggleButton) {
            toggleButton.setAttribute("aria-expanded", "false");
            toggleButton.querySelector(".flow-block__indicator")?.replaceChildren(">");
        }

        appRoot.querySelector(`[data-scenario-panel="${escapeSelectorValue(slug)}"]`)?.remove();
        releaseCollapsedScenarioGap(appRoot, slug);
        syncNavigationSurfaceCacheFromDom();
    }

    function scheduleScenarioSubtaskEnterStateCleanup(slug) {
        if (!slug) {
            return;
        }

        cancelScenarioSubtaskEnterStateCleanup(slug);

        const cleanupDelayMs = resolveScenarioSubtaskEnterAnimationMs(appRoot, slug);
        if (cleanupDelayMs <= 0) {
            clearScenarioSubtaskEnterState(slug);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            scenarioSubtaskEnterCleanupTimeoutIds.delete(slug);
            clearScenarioSubtaskEnterState(slug);
        }, cleanupDelayMs);

        scenarioSubtaskEnterCleanupTimeoutIds.set(slug, timeoutId);
    }

    function cancelScenarioSubtaskEnterStateCleanup(slug) {
        const timeoutId = scenarioSubtaskEnterCleanupTimeoutIds.get(slug);
        if (typeof timeoutId !== "number" || timeoutId <= 0) {
            return;
        }

        window.clearTimeout(timeoutId);
        scenarioSubtaskEnterCleanupTimeoutIds.delete(slug);
    }

    function clearScenarioSubtaskEnterState(slug) {
        if (!slug) {
            return;
        }

        const panel = appRoot.querySelector(`[data-scenario-panel="${escapeSelectorValue(slug)}"]`);
        if (!(panel instanceof HTMLElement)) {
            return;
        }

        Array.from(panel.querySelectorAll("[data-flow-subtask-enter]")).forEach((element) => {
            if (!(element instanceof HTMLElement)) {
                return;
            }

            element.removeAttribute("data-flow-subtask-enter");
            element.style.removeProperty("--flow-subtask-enter-index");
            if (!element.getAttribute("style")?.trim()) {
                element.removeAttribute("style");
            }
        });

        syncNavigationSurfaceCacheFromDom();
    }

    async function toggleScenarioExpansion(slug) {
        if (!slug || activeNavigationAnimationSlugs.has(slug)) {
            return;
        }

        if (state.expandedScenarioSlugs.includes(slug)) {
            await collapseScenarioWithAnimation(slug);
            return;
        }

        await expandScenarioWithAnimation(slug, { loadDetail: true });
    }

    async function toggleAllNavigationScenarios() {
        if (activeNavigationAnimationSlugs.size > 0 || isTogglingAllNavigationScenarios) {
            return;
        }

        isTogglingAllNavigationScenarios = true;

        try {
            const snapshot = Array.isArray(state.collapsedNavigationScenarioSnapshot)
                ? state.collapsedNavigationScenarioSnapshot.filter(Boolean)
                : [];

            if (state.expandedScenarioSlugs.length > 0) {
                const collapsedSlugs = [...state.expandedScenarioSlugs];
                state.collapsedNavigationScenarioSnapshot = collapsedSlugs;
                await Promise.all(collapsedSlugs.map((slug) => collapseScenarioWithAnimation(slug)));
                render();
                return;
            }

            if (snapshot.length === 0) {
                return;
            }

            const knownSlugs = new Set(state.catalog.items.map((item) => item.slug).filter(Boolean));
            const nextExpandedSlugs = Array.from(new Set(snapshot.filter((slug) => knownSlugs.has(slug))));
            state.collapsedNavigationScenarioSnapshot = null;

            if (nextExpandedSlugs.length === 0) {
                render();
                return;
            }

            await Promise.all(nextExpandedSlugs.map((slug) => expandScenarioWithAnimation(slug, { loadDetail: true })));
            render();
        } finally {
            isTogglingAllNavigationScenarios = false;
        }
    }

    async function expandScenarioWithAnimation(slug, { loadDetail = true } = {}) {
        if (!slug || state.expandedScenarioSlugs.includes(slug) || activeNavigationAnimationSlugs.has(slug)) {
            if (loadDetail && slug) {
                await dataOrchestrator.loadScenarioDetail(slug, { syncSelected: false });
            }
            return;
        }

        activeNavigationAnimationSlugs.add(slug);
        if (!state.expandingScenarioSlugs.includes(slug)) {
            state.expandingScenarioSlugs = [...state.expandingScenarioSlugs, slug];
        }
        expandScenario(slug, { loadDetail: false });
        render();

        try {
            await Promise.all([
                animateScenarioExpansion(appRoot, slug, {
                    onFrame: () => {
                        redrawNavigationActiveMarker(appRoot);
                        redrawNavigationTagConnections(appRoot, { preserveAnimation: true });
                    }
                }),
                dataOrchestrator.loadScenarioDetail(slug, { syncSelected: false })
            ]);
            redrawNavigationActiveMarker(appRoot);
            redrawNavigationTagConnections(appRoot);
        } finally {
            state.expandingScenarioSlugs = state.expandingScenarioSlugs.filter((item) => item !== slug);
            scheduleScenarioSubtaskEnterStateCleanup(slug);
            activeNavigationAnimationSlugs.delete(slug);
        }
    }

    async function collapseScenarioWithAnimation(slug) {
        if (!slug || !state.expandedScenarioSlugs.includes(slug) || activeNavigationAnimationSlugs.has(slug)) {
            return;
        }

        activeNavigationAnimationSlugs.add(slug);

        try {
            prepareNavigationMarkerForScenarioCollapse(appRoot, slug);
            redrawNavigationActiveMarker(appRoot);
            await animateScenarioCollapse(appRoot, slug, {
                onFrame: () => {
                    redrawNavigationActiveMarker(appRoot);
                    redrawNavigationTagConnections(appRoot, { preserveAnimation: true });
                }
            });
            collapseScenario(slug);
            syncCollapsedScenarioNavigationNode(slug);
            redrawNavigationActiveMarker(appRoot);
            redrawNavigationTagConnections(appRoot);
        } finally {
            activeNavigationAnimationSlugs.delete(slug);
        }
    }

    function toggleNavigationVisibility() {
        if (state.panelLayoutMode === PANEL_LAYOUT_MODE.STACKED) {
            return;
        }

        const layout = appRoot.querySelector(".lesson-layout");
        const navigationLane = layout?.querySelector(".lesson-layout__lane--navigation");
        const lessonLane = layout?.querySelector(".lesson-layout__lane--lesson");
        const navigationToggle = layout?.querySelector("[data-navigation-visibility-toggle]");
        const focusedInsideNavigation = navigationLane instanceof HTMLElement && navigationLane.contains(document.activeElement);
        const focusedInsideLesson = lessonLane instanceof HTMLElement && lessonLane.contains(document.activeElement);

        if (state.panelLayoutMode === PANEL_LAYOUT_MODE.NAVIGATION_COLLAPSED) {
            state.isCompactNavigationVisible = !state.isCompactNavigationVisible;
            state.isNavigationEffectivelyCollapsed = resolveEffectiveNavigationState();
            state.isNavigationCollapsing = false;
            state.isNavigationExpandedReady = true;
            syncLayoutChrome();
            redrawNavigationActiveMarker(appRoot);
            redrawNavigationTagConnections(appRoot);

            if (
                state.isNavigationEffectivelyCollapsed
                && focusedInsideNavigation
                && navigationToggle instanceof HTMLElement
                && navigationToggle.tagName === "BUTTON"
            ) {
                navigationToggle.focus({ preventScroll: true });
            }

            if (
                !state.isNavigationEffectivelyCollapsed
                && focusedInsideLesson
                && navigationToggle instanceof HTMLElement
                && navigationToggle.tagName === "BUTTON"
            ) {
                navigationToggle.focus({ preventScroll: true });
            }
            return;
        }

        if (state.isNavigationCollapsed) {
            cancelPendingNavigationCollapse();
            state.isNavigationCollapsed = false;
            state.isNavigationEffectivelyCollapsed = resolveEffectiveNavigationState();
            state.isNavigationCollapsing = false;
            state.isNavigationExpandedReady = false;
            syncLayoutChrome();
            redrawNavigationActiveMarker(appRoot);
            scheduleNavigationReveal();
            redrawNavigationTagConnections(appRoot);
        } else {
            cancelPendingNavigationReveal();
            state.isNavigationCollapsed = true;
            state.isNavigationEffectivelyCollapsed = resolveEffectiveNavigationState();
            state.isNavigationCollapsing = true;
            state.isNavigationExpandedReady = true;
            syncLayoutChrome();
            redrawNavigationActiveMarker(appRoot);
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

    function syncResponsivePanelLayoutState() {
        const previousPanelLayoutMode = state.panelLayoutMode;
        const previousEffectiveNavigationState = state.isNavigationEffectivelyCollapsed;
        const nextPanelLayoutMode = resolvePanelLayoutMode();

        if (
            previousPanelLayoutMode !== PANEL_LAYOUT_MODE.NAVIGATION_COLLAPSED
            && nextPanelLayoutMode === PANEL_LAYOUT_MODE.NAVIGATION_COLLAPSED
        ) {
            state.isCompactNavigationVisible = false;
        }

        state.panelLayoutMode = nextPanelLayoutMode;
        state.isNavigationEffectivelyCollapsed = resolveEffectiveNavigationState(nextPanelLayoutMode);
        const shouldScheduleNavigationReveal = nextPanelLayoutMode === PANEL_LAYOUT_MODE.WIDE
            && previousPanelLayoutMode === PANEL_LAYOUT_MODE.NAVIGATION_COLLAPSED
            && !state.isNavigationEffectivelyCollapsed;

        if (nextPanelLayoutMode !== PANEL_LAYOUT_MODE.WIDE) {
            cancelPendingNavigationReveal();
            cancelPendingNavigationCollapse();
            state.isNavigationCollapsing = false;
            state.isNavigationExpandedReady = true;
        } else if (shouldScheduleNavigationReveal) {
            state.isNavigationCollapsing = false;
            state.isNavigationExpandedReady = false;
        }

        return {
            hasLayoutChanged: previousPanelLayoutMode !== nextPanelLayoutMode
                || previousEffectiveNavigationState !== state.isNavigationEffectivelyCollapsed,
            shouldScheduleNavigationReveal
        };
    }

    function resolveEffectiveNavigationState(panelLayoutMode = state.panelLayoutMode) {
        if (panelLayoutMode === PANEL_LAYOUT_MODE.STACKED) {
            return false;
        }

        if (panelLayoutMode === PANEL_LAYOUT_MODE.NAVIGATION_COLLAPSED) {
            return !state.isCompactNavigationVisible;
        }

        return state.isNavigationCollapsed;
    }

    function resolveNavigationToggleActionLabel() {
        if (state.panelLayoutMode === PANEL_LAYOUT_MODE.NAVIGATION_COLLAPSED) {
            return state.isNavigationEffectivelyCollapsed
                ? "Показать левую панель"
                : "Показать среднюю панель";
        }

        return state.isNavigationEffectivelyCollapsed
            ? "Показать левую панель"
            : "Скрыть левую панель";
    }

    function resolveNavigationToggleLabel() {
        if (state.panelLayoutMode === PANEL_LAYOUT_MODE.NAVIGATION_COLLAPSED) {
            return state.isNavigationEffectivelyCollapsed ? ">" : "<";
        }

        return state.isNavigationEffectivelyCollapsed ? ">" : "<";
    }

    function beginNavigationTagHold(tag) {
        const normalizedTag = normalizeNavigationTagToken(tag);
        if (!normalizedTag || state.heldNavigationTag === normalizedTag) {
            return;
        }

        const matchingSlugs = state.catalog.items
            .filter((item) => Array.isArray(item.tags) && item.tags.some((entry) => normalizeNavigationTagToken(entry) === normalizedTag))
            .map((item) => item.slug)
            .filter(Boolean);

        if (!matchingSlugs.length) {
            return;
        }

        state.pinnedNavigationTag = null;
        state.heldNavigationTagExpandedSnapshot = {
            expandedScenarioSlugs: [...state.expandedScenarioSlugs],
            expandingScenarioSlugs: [...state.expandingScenarioSlugs]
        };
        state.heldNavigationTag = normalizedTag;
        state.expandedScenarioSlugs = Array.from(new Set([
            ...state.expandedScenarioSlugs,
            ...matchingSlugs
        ]));
        state.expandingScenarioSlugs = [];
        render();

        matchingSlugs.forEach((slug) => {
            void dataOrchestrator.loadScenarioDetail(slug, { syncSelected: false });
        });
    }

    function endNavigationTagHold(tag) {
        const normalizedTag = normalizeNavigationTagToken(tag);
        if (!normalizedTag || state.heldNavigationTag !== normalizedTag) {
            return;
        }

        restoreNavigationTagHoldSnapshot();
        render();
    }

    function toggleNavigationTagPin(tag) {
        const normalizedTag = normalizeNavigationTagToken(tag);
        if (!normalizedTag) {
            return;
        }

        const pinningFromHeldFilter = state.heldNavigationTag === normalizedTag;
        if (state.heldNavigationTag) {
            restoreNavigationTagHoldSnapshot();
        }

        state.pinnedNavigationTag = pinningFromHeldFilter
            ? normalizedTag
            : (state.pinnedNavigationTag === normalizedTag ? null : normalizedTag);
        render();
    }

    function restoreNavigationTagHoldSnapshot() {
        const snapshot = state.heldNavigationTagExpandedSnapshot;
        state.heldNavigationTag = null;
        state.heldNavigationTagExpandedSnapshot = null;
        state.expandedScenarioSlugs = snapshot?.expandedScenarioSlugs
            ? [...snapshot.expandedScenarioSlugs]
            : [];
        state.expandingScenarioSlugs = snapshot?.expandingScenarioSlugs
            ? [...snapshot.expandingScenarioSlugs]
            : [];
    }

    function handleNavigationMarkerDragStart() {
        navigationMarkerDragState.active = true;
    }

    async function handleNavigationMarkerDragSelection(target) {
        void target;
    }

    async function handleNavigationMarkerDragEnd(target) {
        await queueNavigationMarkerDragOperation(async () => {
            if (!navigationMarkerDragState.active) {
                return;
            }

            const targetMeta = resolveNavigationMarkerDragTargetMeta(target);
            navigationMarkerDragState.active = false;
            if (targetMeta.hash && targetMeta.hash !== window.location.hash) {
                window.history.pushState(null, "", targetMeta.hash);
                await handleRouteChange();
            }
        });
    }
}

function normalizeNavigationTagToken(tag) {
    const normalizedTag = String(tag ?? "").trim().toLowerCase();
    return normalizedTag.length ? normalizedTag : null;
}

function resolveNavigationMarkerDragHash(target) {
    if (!(target instanceof HTMLElement)) {
        return null;
    }

    const href = target.getAttribute("href");
    if (href?.startsWith("#/")) {
        return href;
    }

    const scenarioSlug = normalizeOptionalValue(target.dataset.scenarioToggle);
    if (!scenarioSlug) {
        return null;
    }

    return `#/exercise/${encodeURIComponent(scenarioSlug)}`;
}

function resolveNavigationMarkerDragTargetMeta(target) {
    if (!(target instanceof HTMLElement)) {
        return {
            hash: null,
            scenarioSlug: null,
            kind: null
        };
    }

    const href = target.getAttribute("href");
    if (href?.startsWith("#/")) {
        const route = parseWorkspaceRoute(href);
        return {
            hash: href,
            scenarioSlug: route.name === "exercise" ? route.scenarioSlug : null,
            kind: "href"
        };
    }

    const hash = resolveNavigationMarkerDragHash(target);
    return {
        hash,
        scenarioSlug: normalizeOptionalValue(target.dataset.scenarioToggle),
        kind: "scenario-toggle"
    };
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
            element.setAttribute(FLOW_BLOCK_TAG_STATE_RESTORED_ATTRIBUTE, "true");
        }
    });
}

export function captureNavigationSubtaskGroupTagState(surfaceRoot) {
    if (!(surfaceRoot instanceof HTMLElement)) {
        return [];
    }

    return Array.from(surfaceRoot.querySelectorAll(".flow-subtask-group[data-flow-subtask-active-tag]"))
        .map((element) => {
            if (!(element instanceof HTMLElement)) {
                return null;
            }

            const tag = element.dataset.flowSubtaskActiveTag;
            const panel = element.closest("[data-scenario-panel]");
            const panelKey = panel instanceof HTMLElement ? panel.dataset.scenarioPanel : null;
            if (!tag || !panelKey) {
                return null;
            }

            return {
                panelKey,
                tag
            };
        })
        .filter(Boolean);
}

export function restoreNavigationSubtaskGroupTagState(surfaceRoot, entries) {
    if (!(surfaceRoot instanceof HTMLElement) || !Array.isArray(entries) || entries.length === 0) {
        return;
    }

    entries.forEach((entry) => {
        if (!entry?.panelKey || !entry.tag) {
            return;
        }

        const group = surfaceRoot
            .querySelector(`[data-scenario-panel="${escapeSelectorValue(entry.panelKey)}"] .flow-subtask-group`);
        if (group instanceof HTMLElement) {
            group.dataset.flowSubtaskActiveTag = entry.tag;
        }
    });
}

function scheduleNavigationTagStateRestoreCleanup(surfaceRoot) {
    if (!(surfaceRoot instanceof HTMLElement)) {
        return;
    }

    if (typeof surfaceRoot.__flowTagStateRestoreCleanupFrameId === "number" && surfaceRoot.__flowTagStateRestoreCleanupFrameId) {
        window.cancelAnimationFrame(surfaceRoot.__flowTagStateRestoreCleanupFrameId);
        surfaceRoot.__flowTagStateRestoreCleanupFrameId = 0;
    }

    if (typeof surfaceRoot.__flowTagStateRestoreCleanupCommitFrameId === "number" && surfaceRoot.__flowTagStateRestoreCleanupCommitFrameId) {
        window.cancelAnimationFrame(surfaceRoot.__flowTagStateRestoreCleanupCommitFrameId);
        surfaceRoot.__flowTagStateRestoreCleanupCommitFrameId = 0;
    }

    surfaceRoot.__flowTagStateRestoreCleanupFrameId = window.requestAnimationFrame(() => {
        surfaceRoot.__flowTagStateRestoreCleanupFrameId = 0;
        surfaceRoot.__flowTagStateRestoreCleanupCommitFrameId = window.requestAnimationFrame(() => {
            surfaceRoot.__flowTagStateRestoreCleanupCommitFrameId = 0;
            surfaceRoot.querySelectorAll(`[${FLOW_BLOCK_TAG_STATE_RESTORED_ATTRIBUTE}]`).forEach((element) => {
                if (element instanceof HTMLElement) {
                    element.removeAttribute(FLOW_BLOCK_TAG_STATE_RESTORED_ATTRIBUTE);
                }
            });
            surfaceRoot.querySelectorAll(`[${FLOW_SUBTASK_TAG_STATE_RESTORED_ATTRIBUTE}]`).forEach((element) => {
                if (element instanceof HTMLElement) {
                    element.removeAttribute(FLOW_SUBTASK_TAG_STATE_RESTORED_ATTRIBUTE);
                }
            });
        });
    });
}

function canRetainNavigationSurface(surfaceRoot, nextMarkup) {
    if (!(surfaceRoot instanceof HTMLElement)) {
        return false;
    }

    return serializeNormalizedNavigationMarkup(surfaceRoot.innerHTML)
        === serializeNormalizedNavigationMarkup(nextMarkup);
}

function tryPatchNavigationScenarioNodes(surfaceRoot, nextMarkup) {
    if (!(surfaceRoot instanceof HTMLElement)) {
        return false;
    }

    const template = document.createElement("template");
    template.innerHTML = nextMarkup;

    const currentFlowList = surfaceRoot.querySelector("[data-flow-block-list]");
    const nextFlowList = template.content.querySelector("[data-flow-block-list]");
    if (!(currentFlowList instanceof HTMLElement) || !(nextFlowList instanceof HTMLElement)) {
        return false;
    }

    const currentDivider = surfaceRoot.querySelector(".scenario-flow-divider");
    const nextDivider = template.content.querySelector(".scenario-flow-divider");
    if ((currentDivider instanceof HTMLElement) !== (nextDivider instanceof HTMLElement)) {
        return false;
    }

    const shouldPatchDivider = currentDivider instanceof HTMLElement
        && nextDivider instanceof HTMLElement
        && serializeNormalizedNavigationMarkup(currentDivider.outerHTML)
            !== serializeNormalizedNavigationMarkup(nextDivider.outerHTML);

    const currentScenarioNodes = Array.from(currentFlowList.children).filter(isScenarioFlowNode);
    const nextScenarioNodes = Array.from(nextFlowList.children).filter(isScenarioFlowNode);
    if (currentScenarioNodes.length !== nextScenarioNodes.length) {
        return false;
    }

    const diffEntries = [];

    for (let index = 0; index < currentScenarioNodes.length; index += 1) {
        const currentNode = currentScenarioNodes[index];
        const nextNode = nextScenarioNodes[index];
        const currentSlug = currentNode.querySelector("[data-scenario-toggle]")?.getAttribute("data-scenario-toggle");
        const nextSlug = nextNode.querySelector("[data-scenario-toggle]")?.getAttribute("data-scenario-toggle");

        if (!currentSlug || !nextSlug || currentSlug !== nextSlug) {
            return false;
        }

        if (currentNode.querySelector('[data-scenario-animating="true"]')) {
            continue;
        }

        if (serializeNormalizedNavigationMarkup(currentNode.outerHTML) !== serializeNormalizedNavigationMarkup(nextNode.outerHTML)) {
            diffEntries.push({
                currentNode,
                nextNode
            });
        }
    }

    if (diffEntries.length === 0 && !shouldPatchDivider) {
        return false;
    }

    const preservedNavigationTagState = captureNavigationFlowBlockTagState(surfaceRoot);
    const preservedSubtaskGroupTagState = captureNavigationSubtaskGroupTagState(surfaceRoot);
    if (shouldPatchDivider && currentDivider instanceof HTMLElement && nextDivider instanceof HTMLElement) {
        currentDivider.replaceWith(nextDivider.cloneNode(true));
    }
    diffEntries.forEach(({ currentNode, nextNode }) => {
        currentNode.replaceWith(nextNode.cloneNode(true));
    });
    restoreNavigationFlowBlockTagState(surfaceRoot, preservedNavigationTagState);
    restoreNavigationSubtaskGroupTagState(surfaceRoot, preservedSubtaskGroupTagState);
    scheduleNavigationTagStateRestoreCleanup(surfaceRoot);

    return true;
}

function isScenarioFlowNode(element) {
    return element instanceof HTMLElement && element.classList.contains("flow-node");
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
        if (element.matches("[data-tag-legend-control]")) {
            element.classList.remove("scenario-legend__tag--active");
            element.removeAttribute("aria-pressed");
        }
        TRANSIENT_NAVIGATION_PANEL_ATTRIBUTES.forEach((attributeName) => {
            element.removeAttribute(attributeName);
        });

        if (element.matches("[data-scenario-panel]") && element.getAttribute("style")?.trim()) {
            element.removeAttribute("style");
        }

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
    syncNavigationMarkerTarget({
        mapRoot: surfaceRoot.querySelector("[data-tag-connection-map]"),
        route: state.route,
        selectedScenarioSlug: state.selectedScenarioSlug,
        selectedFocus: state.selectedFocus
    });
}

function prepareNavigationMarkerForScenarioCollapse(appRoot, slug) {
    if (!(appRoot instanceof HTMLElement) || !slug) {
        return;
    }

    const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
    const collapsingPanel = appRoot.querySelector(`[data-scenario-panel="${escapeSelectorValue(slug)}"]`);
    const collapsingToggle = appRoot.querySelector(`[data-scenario-toggle="${escapeSelectorValue(slug)}"]`);
    if (
        !(mapRoot instanceof HTMLElement)
        || !(collapsingPanel instanceof HTMLElement)
        || !(collapsingToggle instanceof HTMLElement)
    ) {
        return;
    }

    const activeTarget = resolveNavigationActiveMarkerTarget(mapRoot);
    if (!(activeTarget instanceof HTMLElement) || !collapsingPanel.contains(activeTarget)) {
        return;
    }

    delete activeTarget.dataset.navigationMarkerTarget;
    collapsingToggle.dataset.navigationMarkerTarget = "true";
}

function syncNavigationRouteShortcutState(surfaceRoot, state) {
    const routeShortcutStates = [
        ["#/catalog", state.route === "catalog"],
        ["#/progress", state.route === "progress"],
        [SANDBOX_ROUTE_HASH, isSandboxShortcutActive(state)]
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
        feedbackPanel: createInitialFeedbackPanelState(),
        workspacePlayback: createInitialWorkspacePlaybackState(),
        commandHistory: []
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

function createInitialWorkspacePlaybackState() {
    return {
        status: "idle",
        currentContext: null,
        previousContext: null,
        command: null,
        outcomeCorrectness: null,
        updatedAt: null
    };
}

function createCommandHistoryEntry(entryId, preparedSubmission) {
    return {
        kind: "command",
        id: entryId,
        command: preparedSubmission.answer,
        status: "running",
        summary: `Команда отправлена: ${preparedSubmission.answer}. Ждём новый snapshot workspace.`,
        terminalOutput: null,
        createdAt: preparedSubmission.preparedAt,
        completedAt: null
    };
}

function createSystemCommandHistoryEntry(entryId, text, completedAt) {
    return {
        kind: "system",
        id: entryId,
        text,
        tone: "correct",
        createdAt: completedAt,
        completedAt
    };
}

function updateCommandHistoryEntry(commandHistory, entryId, patch) {
    return commandHistory.map((entry) => (
        entry.id === entryId
            ? {
                ...entry,
                ...patch
            }
            : entry
    ));
}

function resolveCommandHistoryStatus(correctness) {
    switch (correctness) {
        case "correct":
            return "correct";
        case "incorrect":
        case "partial":
        case "unsupported":
            return "applied";
        default:
            return "applied";
    }
}

function resolveCommandHistorySummary(command, correctness) {
    return correctness === "correct"
        ? `Команда ${command} принята. Viewer уже показывает новое состояние веток и дерева.`
        : "";
}

function resolveCorrectStateConsoleMessage(repositoryContext) {
    const branches = Array.isArray(repositoryContext?.branches) ? repositoryContext.branches : [];
    return branches.length > 0
        ? "Правильное состояние ветки достигнуто."
        : "Целевое состояние репозитория достигнуто.";
}

function createFeedbackPanelState({
    previousFeedbackPanel = null,
    detail = null,
    repositoryContext = null,
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
    const activeRepositoryContext = repositoryContext ?? detail?.workspace?.repositoryContext ?? null;
    const branches = Array.isArray(activeRepositoryContext?.branches) ? activeRepositoryContext.branches : [];
    const files = Array.isArray(activeRepositoryContext?.files) ? activeRepositoryContext.files : [];
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
        .replace(/Выберите другой provider/gi, "Выберите другой источник")
        .replace(/provider/gi, "источник");
}

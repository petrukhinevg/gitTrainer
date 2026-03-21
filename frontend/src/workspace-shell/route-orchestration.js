import { shouldResetLessonScrollForRouteChange } from "./route-scroll-policy.js";

export function createWorkspaceRouteOrchestrator({
    state,
    render,
    windowObject = window,
    ensureCatalogLoaded,
    loadProgressSummary,
    loadScenarioDetail,
    ensureExerciseSession,
    onExerciseRouteSelected,
    resetRouteScopedState,
    setPendingLessonScrollReset
}) {
    async function handleRouteChange() {
        const previousRoute = state.route;
        const previousScenarioSlug = state.selectedScenarioSlug;
        const previousSelectedFocus = state.selectedFocus;
        const previousProviderName = state.providerName;
        const route = parseWorkspaceRoute(windowObject.location.hash);

        setPendingLessonScrollReset(shouldResetLessonScrollForRouteChange({
            previousRoute,
            previousScenarioSlug,
            previousSelectedFocus,
            nextRoute: route.name,
            nextScenarioSlug: route.scenarioSlug,
            nextSelectedFocus: route.focus
        }));

        state.route = route.name;
        state.selectedScenarioSlug = route.scenarioSlug;
        state.selectedFocus = route.focus;

        if (route.name === "exercise" && route.scenarioSlug) {
            onExerciseRouteSelected(route.scenarioSlug);
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

    return {
        handleRouteChange
    };
}

export function parseWorkspaceRoute(hash) {
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

export function resetRouteScopedWorkspaceState({
    state,
    previousRoute,
    previousScenarioSlug,
    previousProviderName,
    createInitialSubmissionDraftState,
    createInitialSessionState,
    createInitialProgressState,
    invalidateSessionRequests
}) {
    const sameExerciseScenario = previousRoute === "exercise"
        && state.route === "exercise"
        && previousScenarioSlug === state.selectedScenarioSlug
        && previousProviderName === state.providerName;

    if (!sameExerciseScenario) {
        state.submissionDraft = createInitialSubmissionDraftState();
        state.session = createInitialSessionState();
        invalidateSessionRequests();
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

function normalizeOptionalValue(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

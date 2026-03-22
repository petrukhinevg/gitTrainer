import { escapeSelectorValue } from "./dom-helpers.js";

export function bindNavigationActiveMarker({ appRoot }) {
    const layoutRoot = appRoot.querySelector(".lesson-layout");
    const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
    if (!(layoutRoot instanceof HTMLElement) || !(navigationLane instanceof HTMLElement)) {
        return;
    }

    const navigationBody = navigationLane.querySelector(".lesson-lane__body");
    const mapRoot = navigationLane.querySelector("[data-tag-connection-map]");
    const marker = navigationLane.querySelector("[data-navigation-active-marker]");
    if (!(mapRoot instanceof HTMLElement) || !(marker instanceof HTMLElement)) {
        navigationLane.__redrawNavigationActiveMarker = null;
        navigationLane.__navigationActiveMarkerCleanup = null;
        navigationLane.__navigationActiveMarkerBinding = null;
        return;
    }

    const existingBinding = navigationLane.__navigationActiveMarkerBinding ?? null;
    if (
        existingBinding?.layoutRoot === layoutRoot
        && existingBinding?.navigationBody === navigationBody
        && existingBinding?.mapRoot === mapRoot
        && existingBinding?.marker === marker
    ) {
        navigationLane.__redrawNavigationActiveMarker?.();
        return;
    }

    navigationLane.__navigationActiveMarkerCleanup?.();

    const previousState = navigationLane.__navigationActiveMarkerState ?? null;
    if (previousState) {
        applyNavigationActiveMarkerState(marker, previousState, { instant: true });
    } else {
        applyNavigationActiveMarkerState(marker, createHiddenNavigationActiveMarkerState(), { instant: true });
    }

    let rafId = 0;
    let resizeObserver = null;
    let pendingOptions = null;

    const draw = ({ instant = false } = {}) => {
        rafId = 0;
        pendingOptions = null;

        const previousState = navigationLane.__navigationActiveMarkerState ?? null;
        const nextState = resolveNavigationActiveMarkerState({
            layoutRoot,
            mapRoot
        });
        applyNavigationActiveMarkerState(marker, nextState, { instant, previousState });
        navigationLane.__navigationActiveMarkerState = nextState;
    };

    const queueDraw = (options = {}) => {
        const nextInstant = Boolean(options.instant);
        pendingOptions = {
            instant: pendingOptions ? pendingOptions.instant && nextInstant : nextInstant
        };

        if (rafId) {
            return;
        }

        rafId = window.requestAnimationFrame(() => {
            draw(pendingOptions ?? {});
        });
    };

    window.addEventListener("resize", queueDraw);
    navigationBody?.addEventListener("scroll", queueDraw);

    if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
            queueDraw();
        });
        resizeObserver.observe(mapRoot);
    }

    navigationLane.__redrawNavigationActiveMarker = queueDraw;
    navigationLane.__navigationActiveMarkerBinding = {
        layoutRoot,
        navigationBody,
        mapRoot,
        marker
    };
    navigationLane.__navigationActiveMarkerCleanup = () => {
        if (rafId) {
            window.cancelAnimationFrame(rafId);
        }

        window.removeEventListener("resize", queueDraw);
        navigationBody?.removeEventListener("scroll", queueDraw);
        resizeObserver?.disconnect();
        navigationLane.__navigationActiveMarkerBinding = null;
    };

    queueDraw({ instant: !previousState });
}

export function redrawNavigationActiveMarker(appRoot, options = {}) {
    appRoot.querySelector(".lesson-lane--navigation")?.__redrawNavigationActiveMarker?.(options);
}

export function resolveNavigationActiveMarkerState({ layoutRoot, mapRoot }) {
    if (!shouldRenderNavigationActiveMarker(layoutRoot)) {
        return createHiddenNavigationActiveMarkerState();
    }

    const target = resolveNavigationActiveMarkerTarget(mapRoot);
    if (!(target instanceof HTMLElement)) {
        return createHiddenNavigationActiveMarkerState();
    }

    const geometry = measureNavigationActiveMarkerGeometry({ mapRoot, target });
    if (!geometry) {
        return createHiddenNavigationActiveMarkerState();
    }

    return {
        visible: true,
        top: geometry.top,
        height: geometry.height
    };
}

export function resolveNavigationActiveMarkerTarget(mapRoot) {
    if (!(mapRoot instanceof HTMLElement)) {
        return null;
    }

    return (
        mapRoot.querySelector('[data-navigation-marker-target="true"]')
        ?? mapRoot.querySelector(".flow-block--subtask.flow-block--active")
        ?? mapRoot.querySelector("[data-scenario-toggle].flow-block--active")
        ?? mapRoot.querySelector(".flow-block--active")
    );
}

export function syncNavigationMarkerTarget({
    mapRoot,
    route,
    selectedScenarioSlug,
    selectedFocus
}) {
    if (!(mapRoot instanceof HTMLElement)) {
        return;
    }

    Array.from(mapRoot.querySelectorAll("[data-navigation-marker-target]")).forEach((element) => {
        if (element instanceof HTMLElement) {
            delete element.dataset.navigationMarkerTarget;
        }
    });

    const target = resolveNavigationMarkerTargetElement({
        mapRoot,
        route,
        selectedScenarioSlug,
        selectedFocus
    });

    if (target instanceof HTMLElement) {
        target.dataset.navigationMarkerTarget = "true";
    }
}

function resolveNavigationMarkerTargetElement({
    mapRoot,
    route,
    selectedScenarioSlug,
    selectedFocus
}) {
    if (route === "catalog" || route === "progress") {
        return mapRoot.querySelector(`[href="#/${escapeSelectorValue(route)}"]`);
    }

    if (!selectedScenarioSlug) {
        return null;
    }

    const scenarioPanel = mapRoot.querySelector(
        `[data-scenario-panel="${escapeSelectorValue(selectedScenarioSlug)}"]`
    );
    const normalizedFocus = normalizeOptionalValue(selectedFocus);

    if (scenarioPanel instanceof HTMLElement) {
        if (normalizedFocus) {
            const focusedSubtask = scenarioPanel.querySelector(
                `[data-scenario-focus="${escapeSelectorValue(normalizedFocus)}"]`
            );
            if (focusedSubtask instanceof HTMLElement) {
                return focusedSubtask;
            }
        }

        const overviewLink = scenarioPanel.querySelector('[data-scenario-focus="overview"]');
        if (overviewLink instanceof HTMLElement) {
            return overviewLink;
        }
    }

    return mapRoot.querySelector(`[data-scenario-toggle="${escapeSelectorValue(selectedScenarioSlug)}"]`);
}

function normalizeOptionalValue(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

export function measureNavigationActiveMarkerGeometry({ mapRoot, target }) {
    if (!(mapRoot instanceof HTMLElement) || !(target instanceof HTMLElement)) {
        return null;
    }

    const mapRect = mapRoot.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    if (
        !Number.isFinite(mapRect.top)
        || !Number.isFinite(targetRect.top)
        || !Number.isFinite(targetRect.height)
        || targetRect.height <= 0
    ) {
        return null;
    }

    return {
        top: targetRect.top - mapRect.top,
        height: targetRect.height
    };
}

function shouldRenderNavigationActiveMarker(layoutRoot) {
    if (!(layoutRoot instanceof HTMLElement)) {
        return false;
    }

    return !layoutRoot.classList.contains("lesson-layout--navigation-collapsed")
        || layoutRoot.classList.contains("lesson-layout--navigation-collapsing");
}

function createHiddenNavigationActiveMarkerState() {
    return {
        visible: false,
        top: 0,
        height: 0
    };
}

export function resolveNavigationActiveMarkerMotionDuration(previousState, nextState) {
    if (!previousState?.visible || !nextState?.visible) {
        return 240;
    }

    const travelDistance = Math.abs((nextState.top ?? 0) - (previousState.top ?? 0));
    const sizeDelta = Math.abs((nextState.height ?? 0) - (previousState.height ?? 0));
    const weightedDistance = travelDistance + (sizeDelta * 0.35);

    return clampNumber(Math.round(240 + (weightedDistance * 0.95)), 240, 620);
}

function applyNavigationActiveMarkerState(marker, state, { instant = false, previousState = null } = {}) {
    marker.classList.toggle("navigation-flow-rail__marker--instant", instant);

    marker.style.setProperty(
        "--navigation-active-marker-motion-duration",
        `${resolveNavigationActiveMarkerMotionDuration(previousState, state)}ms`
    );

    if (typeof state?.top === "number") {
        marker.style.setProperty("--navigation-active-marker-top", `${state.top}px`);
    }

    if (typeof state?.height === "number") {
        marker.style.setProperty("--navigation-active-marker-height", `${Math.max(state.height, 24)}px`);
    }

    if (state?.visible) {
        marker.dataset.visible = "true";
    } else {
        delete marker.dataset.visible;
    }
}

function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

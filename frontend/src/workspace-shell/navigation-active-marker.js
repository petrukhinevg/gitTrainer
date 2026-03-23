import { escapeSelectorValue } from "./dom-helpers.js";

export function bindNavigationActiveMarker({
    appRoot,
    onMarkerDragStart = null,
    onMarkerDragTargetChange = null,
    onMarkerDragEnd = null
}) {
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
        && existingBinding?.onMarkerDragStart === onMarkerDragStart
        && existingBinding?.onMarkerDragTargetChange === onMarkerDragTargetChange
        && existingBinding?.onMarkerDragEnd === onMarkerDragEnd
    ) {
        navigationLane.__redrawNavigationActiveMarker?.();
        return;
    }

    navigationLane.__navigationActiveMarkerCleanup?.();

    const previousState = navigationLane.__navigationActiveMarkerState ?? null;
    const dragSession = navigationLane.__navigationActiveMarkerDragSession ?? {
        active: false,
        clientY: null,
        snapshot: null
    };
    navigationLane.__navigationActiveMarkerDragSession = dragSession;
    if (previousState) {
        applyNavigationActiveMarkerState(marker, previousState, { instant: true });
    } else {
        applyNavigationActiveMarkerState(marker, createHiddenNavigationActiveMarkerState(), { instant: true });
    }

    let rafId = 0;
    let resizeObserver = null;
    let pendingOptions = null;
    let dragTargetDescriptor = navigationLane.__navigationActiveMarkerDragDescriptor ?? null;
    let isMarkerDragging = dragSession.active || Boolean(dragTargetDescriptor);

    const draw = ({ instant = false } = {}) => {
        rafId = 0;
        pendingOptions = null;

        const previousState = navigationLane.__navigationActiveMarkerState ?? null;
        const nextState = resolveNavigationActiveMarkerState({
            layoutRoot,
            mapRoot,
            dragTargetDescriptor
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

    const applyMarkerDraggingState = (isDragging) => {
        isMarkerDragging = isDragging;
        marker.classList.toggle("navigation-flow-rail__marker--dragging", isDragging);
    };

    const resolveCurrentDragTarget = () => resolveNavigationMarkerTargetFromDescriptor(mapRoot, dragTargetDescriptor);

    const updateMarkerDragTarget = (clientY) => {
        const nextTarget = resolveNavigationMarkerDragTarget({
            mapRoot,
            clientY,
            dragSnapshot: dragSession.snapshot,
            currentTargetDescriptor: dragTargetDescriptor
        });
        const nextDescriptor = describeNavigationMarkerTarget(nextTarget);
        if (isSameNavigationMarkerTargetDescriptor(dragTargetDescriptor, nextDescriptor)) {
            return;
        }

        const shouldAnimate = shouldAnimateNavigationMarkerDragTransition({
            currentDescriptor: dragTargetDescriptor,
            nextDescriptor
        });
        dragTargetDescriptor = nextDescriptor;
        navigationLane.__navigationActiveMarkerDragDescriptor = nextDescriptor;
        queueDraw({ instant: !shouldAnimate });
        if (nextTarget instanceof HTMLElement) {
            onMarkerDragTargetChange?.(nextTarget);
        }
    };

    const stopMarkerDrag = () => {
        if (!isMarkerDragging) {
            return;
        }

        const finalTarget = resolveCurrentDragTarget();
        dragSession.active = false;
        dragSession.clientY = null;
        dragSession.snapshot = null;
        dragTargetDescriptor = null;
        navigationLane.__navigationActiveMarkerDragDescriptor = null;
        applyMarkerDraggingState(false);
        window.removeEventListener("mousemove", handleMarkerDragMove);
        window.removeEventListener("mouseup", stopMarkerDrag);
        queueDraw();
        onMarkerDragEnd?.(finalTarget);
    };

    const handleMarkerDragMove = (event) => {
        if (!isMarkerDragging) {
            return;
        }

        if ((event.buttons & 1) === 0) {
            stopMarkerDrag();
            return;
        }

        event.preventDefault();
        dragSession.clientY = event.clientY;
        updateMarkerDragTarget(event.clientY);
    };

    const startMarkerDrag = (event) => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
            return;
        }

        event.preventDefault();
        dragSession.active = true;
        dragSession.clientY = event.clientY;
        dragSession.snapshot = createNavigationMarkerDragSnapshot(mapRoot);
        applyMarkerDraggingState(true);
        onMarkerDragStart?.();
        updateMarkerDragTarget(event.clientY);
        window.addEventListener("mousemove", handleMarkerDragMove);
        window.addEventListener("mouseup", stopMarkerDrag);
    };

    window.addEventListener("resize", queueDraw);
    navigationBody?.addEventListener("scroll", queueDraw);
    marker.addEventListener("mousedown", startMarkerDrag);

    if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
            queueDraw();
        });
        resizeObserver.observe(mapRoot);
    }

    applyMarkerDraggingState(isMarkerDragging);
    if (dragSession.active) {
        window.addEventListener("mousemove", handleMarkerDragMove);
        window.addEventListener("mouseup", stopMarkerDrag);
        if (Number.isFinite(dragSession.clientY)) {
            updateMarkerDragTarget(dragSession.clientY);
        }
    }

    navigationLane.__redrawNavigationActiveMarker = queueDraw;
    navigationLane.__navigationActiveMarkerBinding = {
        layoutRoot,
        navigationBody,
        mapRoot,
        marker,
        onMarkerDragStart,
        onMarkerDragTargetChange,
        onMarkerDragEnd
    };
    navigationLane.__navigationActiveMarkerCleanup = () => {
        if (rafId) {
            window.cancelAnimationFrame(rafId);
        }

        window.removeEventListener("resize", queueDraw);
        navigationBody?.removeEventListener("scroll", queueDraw);
        marker.removeEventListener("mousedown", startMarkerDrag);
        window.removeEventListener("mousemove", handleMarkerDragMove);
        window.removeEventListener("mouseup", stopMarkerDrag);
        resizeObserver?.disconnect();
        navigationLane.__navigationActiveMarkerBinding = null;
    };

    queueDraw({ instant: !previousState });
}

export function redrawNavigationActiveMarker(appRoot, options = {}) {
    appRoot.querySelector(".lesson-lane--navigation")?.__redrawNavigationActiveMarker?.(options);
}

export function resolveNavigationActiveMarkerState({ layoutRoot, mapRoot, dragTargetDescriptor = null }) {
    if (!shouldRenderNavigationActiveMarker(layoutRoot)) {
        return createHiddenNavigationActiveMarkerState();
    }

    const target = resolveNavigationActiveMarkerTarget(mapRoot, dragTargetDescriptor);
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

export function resolveNavigationActiveMarkerTarget(mapRoot, dragTargetDescriptor = null) {
    if (!(mapRoot instanceof HTMLElement)) {
        return null;
    }

    const dragTarget = resolveNavigationMarkerTargetFromDescriptor(mapRoot, dragTargetDescriptor);
    if (dragTarget instanceof HTMLElement) {
        return dragTarget;
    }

    return (
        mapRoot.querySelector('[data-navigation-marker-target="true"]')
        ?? mapRoot.querySelector(".flow-block--subtask.flow-block--active")
        ?? mapRoot.querySelector("[data-scenario-toggle].flow-block--active")
        ?? mapRoot.querySelector(".flow-block--active")
    );
}

export function resolveNavigationMarkerDragTarget({
    mapRoot,
    clientY,
    dragSnapshot = null,
    currentTargetDescriptor = null
}) {
    if (!(mapRoot instanceof HTMLElement) || !Number.isFinite(clientY)) {
        return null;
    }

    const scopedRoot = resolveNavigationMarkerDragScopeRoot({
        mapRoot,
        clientY,
        currentTargetDescriptor
    });
    const dynamicScopedCandidates = scopedRoot
        ? collectNavigationMarkerDragCandidates(scopedRoot)
        : [];
    const snapshotCandidates = resolveNavigationMarkerDragSnapshotCandidates({
        dragSnapshot,
        currentTargetDescriptor,
        clientY
    });
    const candidates = dynamicScopedCandidates.length > 0
        ? dynamicScopedCandidates
        : snapshotCandidates.length > 0
            ? snapshotCandidates
            : collectNavigationMarkerDragCandidates(mapRoot);

    if (candidates.length === 0) {
        return null;
    }

    const directHit = candidates.find((candidate) => clientY >= candidate.top && clientY <= candidate.bottom);
    if (directHit) {
        return resolveNavigationMarkerDragCandidateElement(mapRoot, directHit.element);
    }

    const closestCandidate = candidates.reduce((closestEntry, candidate) => {
        if (!closestEntry) {
            return candidate;
        }

        const closestDistance = Math.abs(clientY - closestEntry.centerY);
        const nextDistance = Math.abs(clientY - candidate.centerY);
        return nextDistance < closestDistance ? candidate : closestEntry;
    }, null);

    return resolveNavigationMarkerDragCandidateElement(mapRoot, closestCandidate?.element ?? null);
}

export function createNavigationMarkerDragSnapshot(mapRoot) {
    if (!(mapRoot instanceof HTMLElement)) {
        return [];
    }

    return collectNavigationMarkerDragCandidates(mapRoot)
        .map((candidate) => {
            const descriptor = describeNavigationMarkerTarget(candidate.element);
            if (!descriptor) {
                return null;
            }

            return {
                descriptor,
                top: candidate.top,
                bottom: candidate.bottom,
                centerY: candidate.centerY,
                ...resolveNavigationMarkerDragFlowNodeGeometry(candidate.element)
            };
        })
        .filter(Boolean);
}

function collectNavigationMarkerDragCandidates(root) {
    return Array.from(root.querySelectorAll('a[href^="#/"], [data-scenario-toggle]'))
        .filter((element) => element instanceof HTMLElement)
        .map((element) => {
            const rect = element.getBoundingClientRect();
            if (!Number.isFinite(rect.top) || !Number.isFinite(rect.height) || rect.height <= 0) {
                return null;
            }

            return {
                element,
                top: rect.top,
                bottom: rect.top + rect.height,
                centerY: rect.top + (rect.height / 2)
            };
        })
        .filter(Boolean);
}

function resolveNavigationMarkerDragSnapshotCandidates({
    dragSnapshot,
    currentTargetDescriptor,
    clientY
}) {
    if (!Array.isArray(dragSnapshot) || dragSnapshot.length === 0) {
        return [];
    }

    const currentEntry = dragSnapshot.find((entry) => isSameNavigationMarkerTargetDescriptor(
        entry.descriptor,
        currentTargetDescriptor
    ));
    const isInsideCurrentFlowNode = currentEntry
        && Number.isFinite(currentEntry.flowNodeTop)
        && Number.isFinite(currentEntry.flowNodeBottom)
        && clientY >= currentEntry.flowNodeTop
        && clientY <= currentEntry.flowNodeBottom;

    const scopedEntries = isInsideCurrentFlowNode && currentEntry?.flowNodeKey
        ? dragSnapshot.filter((entry) => entry.flowNodeKey === currentEntry.flowNodeKey)
        : dragSnapshot;

    return scopedEntries.map((entry) => ({
        element: entry.descriptor,
        top: entry.top,
        bottom: entry.bottom,
        centerY: entry.centerY
    }));
}

export function describeNavigationMarkerTarget(target) {
    if (!(target instanceof HTMLElement)) {
        return null;
    }

    const href = target.getAttribute("href");
    if (href) {
        return {
            kind: "href",
            key: href
        };
    }

    if (target.dataset.scenarioToggle) {
        return {
            kind: "scenario-toggle",
            key: target.dataset.scenarioToggle
        };
    }

    return null;
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

function resolveNavigationMarkerTargetFromDescriptor(mapRoot, descriptor) {
    if (!(mapRoot instanceof HTMLElement) || !descriptor?.kind || !descriptor.key) {
        return null;
    }

    if (descriptor.kind === "href") {
        return mapRoot.querySelector(`[href="${escapeSelectorValue(descriptor.key)}"]`);
    }

    if (descriptor.kind === "scenario-toggle") {
        return mapRoot.querySelector(`[data-scenario-toggle="${escapeSelectorValue(descriptor.key)}"]`);
    }

    return null;
}

function resolveNavigationMarkerDragFlowNodeKey(element) {
    if (!(element instanceof HTMLElement)) {
        return null;
    }

    const flowNode = element.closest(".flow-node");
    if (flowNode instanceof HTMLElement) {
        const scenarioToggle = flowNode.querySelector("[data-scenario-toggle]");
        if (scenarioToggle instanceof HTMLElement && scenarioToggle.dataset.scenarioToggle) {
            return `scenario:${scenarioToggle.dataset.scenarioToggle}`;
        }
    }

    const href = element.getAttribute("href");
    if (href) {
        return `href:${href}`;
    }

    if (element.dataset.scenarioToggle) {
        return `scenario:${element.dataset.scenarioToggle}`;
    }

    return null;
}

function resolveNavigationMarkerDragFlowNodeGeometry(element) {
    const flowNodeKey = resolveNavigationMarkerDragFlowNodeKey(element);
    const flowNode = element instanceof HTMLElement ? element.closest(".flow-node") : null;
    const flowNodeRect = flowNode instanceof HTMLElement ? flowNode.getBoundingClientRect() : null;

    return {
        flowNodeKey,
        flowNodeTop: Number.isFinite(flowNodeRect?.top) ? flowNodeRect.top : null,
        flowNodeBottom: Number.isFinite(flowNodeRect?.bottom) ? flowNodeRect.bottom : null
    };
}

function resolveNavigationMarkerDragCandidateElement(mapRoot, candidateElement) {
    if (candidateElement instanceof HTMLElement) {
        return candidateElement;
    }

    if (candidateElement?.kind && candidateElement?.key) {
        return resolveNavigationMarkerTargetFromDescriptor(mapRoot, candidateElement);
    }

    return null;
}

function resolveNavigationMarkerDragScopeRoot({
    mapRoot,
    clientY,
    currentTargetDescriptor
}) {
    const currentTarget = resolveNavigationMarkerTargetFromDescriptor(mapRoot, currentTargetDescriptor);
    if (!(currentTarget instanceof HTMLElement)) {
        return null;
    }

    const flowNode = currentTarget.closest(".flow-node");
    if (!(flowNode instanceof HTMLElement)) {
        return null;
    }

    const candidates = collectNavigationMarkerDragCandidates(flowNode);
    if (candidates.length === 0) {
        return null;
    }

    const top = Math.min(...candidates.map((candidate) => candidate.top));
    const bottom = Math.max(...candidates.map((candidate) => candidate.bottom));
    if (!Number.isFinite(top) || !Number.isFinite(bottom)) {
        return null;
    }

    return clientY >= top && clientY <= bottom ? flowNode : null;
}

function isSameNavigationMarkerTargetDescriptor(left, right) {
    return left?.kind === right?.kind && left?.key === right?.key;
}

function shouldAnimateNavigationMarkerDragTransition({ currentDescriptor, nextDescriptor }) {
    if (!currentDescriptor || !nextDescriptor) {
        return false;
    }

    return currentDescriptor.kind === "scenario-toggle" || nextDescriptor.kind === "scenario-toggle";
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

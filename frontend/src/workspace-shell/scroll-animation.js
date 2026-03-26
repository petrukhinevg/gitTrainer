import { escapeSelectorValue } from "./dom-helpers.js";
import {
    FLOW_SUBTASK_ENTER_ANIMATION_MS,
    FLOW_SUBTASK_ENTER_STAGGER_MS,
    NAVIGATION_LAYOUT_TOGGLE_ANIMATION_MS,
    NAVIGATION_TOGGLE_ANIMATION_MS,
    PANEL_LAYOUT_CONFIG
} from "./panel-layout-config.js";

export {
    FLOW_SUBTASK_ENTER_ANIMATION_MS,
    FLOW_SUBTASK_ENTER_STAGGER_MS,
    NAVIGATION_LAYOUT_TOGGLE_ANIMATION_MS,
    NAVIGATION_TOGGLE_ANIMATION_MS
};

export function captureLaneScrollPositions({ excludedLaneNames = [] } = {}) {
    const excludedLaneNameSet = new Set(excludedLaneNames);
    return Array.from(document.querySelectorAll(".lesson-lane__body"))
        .map((laneBody) => {
            const laneRoot = laneBody.closest(".lesson-lane");
            const laneName = Array.from(laneRoot?.classList ?? [])
                .find((className) => className.startsWith("lesson-lane--"))
                ?.replace("lesson-lane--", "");

            if (!laneName || excludedLaneNameSet.has(laneName)) {
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

export function resetLaneScrollPosition(laneName) {
    const laneBody = document.querySelector(`.lesson-lane--${laneName} .lesson-lane__body`);
    if (!laneBody) {
        return;
    }

    laneBody.scrollTop = 0;
    laneBody.scrollLeft = 0;
}

export function restoreLaneScrollPositions(positions) {
    positions.forEach((position) => {
        const laneBody = document.querySelector(`.lesson-lane--${position.laneName} .lesson-lane__body`);
        if (!laneBody) {
            return;
        }

        laneBody.scrollTop = position.scrollTop;
        laneBody.scrollLeft = position.scrollLeft;
    });
}

export function captureSurfaceScrollState(surfaceRoot) {
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

export function restoreSurfaceScrollState(surfaceRoot, scrollState) {
    scrollState.forEach((entry) => {
        const element = resolveSurfaceScrollElement(surfaceRoot, entry.key);
        if (!element) {
            return;
        }

        element.scrollTop = entry.scrollTop;
        element.scrollLeft = entry.scrollLeft;
    });
}

export function bindSmoothScrollContainers() {
    // Internal panels rely on frequent programmatic scroll restores during rerender.
    // Native wheel scrolling is more stable here than an additional JS animation layer.
}

export function animateScenarioExpansion(appRoot, slug, { onFrame = null } = {}) {
    const panel = findScenarioPanel(appRoot, slug);
    if (!panel || prefersReducedMotion()) {
        findScenarioToggle(appRoot, slug)?.setAttribute("aria-expanded", "true");
        onFrame?.();
        return Promise.resolve();
    }

    const toggleButton = findScenarioToggle(appRoot, slug);
    const flowNodeBody = resolveScenarioGapContainer(panel);
    const flowNodeGap = readFlowNodeGap(flowNodeBody);
    const expansionDuration = resolveScenarioExpansionDuration(panel);

    delete panel.dataset.tagConnectionCollapsing;
    panel.dataset.scenarioAnimating = "true";
    panel.style.height = "0px";
    panel.style.opacity = "0";
    panel.style.overflow = "hidden";
    panel.style.willChange = "height, opacity";
    prepareFlowNodeExpansion(flowNodeBody, flowNodeGap);

    return new Promise((resolve) => {
        let observer = null;
        const stopFrameTracking = startAnimationFrameTracking(onFrame);

        const startAnimation = () => {
            const targetHeight = measureExpandedPanelHeight(panel);
            if (typeof ResizeObserver !== "undefined") {
                observer = new ResizeObserver(() => {
                    if (panel.style.height && panel.style.height !== "auto") {
                        panel.style.height = formatPixelValue(measureExpandedPanelHeight(panel));
                    }
                });
                observer.observe(panel);
            }

            toggleButton?.setAttribute("aria-expanded", "true");
            panel.style.transition = createScenarioPanelTransition(expansionDuration);
            void panel.offsetHeight;
            panel.style.height = formatPixelValue(targetHeight);
            panel.style.opacity = "1";
            startFlowNodeGapExpansion(flowNodeBody, flowNodeGap, expansionDuration);

            void waitForScenarioAnimation(panel, expansionDuration, () => {
                stopFrameTracking();
                observer?.disconnect();
                panel.style.removeProperty("height");
                panel.style.removeProperty("opacity");
                panel.style.removeProperty("overflow");
                panel.style.removeProperty("transition");
                panel.style.removeProperty("will-change");
                delete panel.dataset.scenarioAnimating;
                releaseFlowNodeGapStyles(flowNodeBody);
                onFrame?.();
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

export function animateScenarioCollapse(appRoot, slug, { onFrame = null } = {}) {
    const panel = findScenarioPanel(appRoot, slug);
    if (!panel || prefersReducedMotion()) {
        onFrame?.();
        return Promise.resolve();
    }

    const toggleButton = findScenarioToggle(appRoot, slug);
    const navigationBody = appRoot.querySelector(".lesson-lane--navigation .lesson-lane__body");
    const scrollStabilizer = createNavigationCollapseScrollStabilizer(panel, navigationBody);
    const flowNodeBody = resolveScenarioGapContainer(panel);
    const flowNodeGap = readFlowNodeGap(flowNodeBody);

    panel.dataset.tagConnectionCollapsing = "true";
    panel.dataset.scenarioAnimating = "true";
    toggleButton?.setAttribute("aria-expanded", "false");
    panel.style.height = formatPixelValue(panel.getBoundingClientRect().height);
    panel.style.opacity = "1";
    panel.style.overflow = "hidden";
    prepareFlowNodeCollapse(flowNodeBody, flowNodeGap);
    panel.getBoundingClientRect();

    panel.style.transition = createScenarioPanelTransition(NAVIGATION_TOGGLE_ANIMATION_MS);
    panel.style.height = "0px";
    panel.style.opacity = "0";
    startFlowNodeGapCollapse(flowNodeBody, flowNodeGap, NAVIGATION_TOGGLE_ANIMATION_MS);

    const stopFrameTracking = startAnimationFrameTracking(() => {
        scrollStabilizer?.update();
        onFrame?.();
    });
    return waitForScenarioAnimation(panel, NAVIGATION_TOGGLE_ANIMATION_MS, () => {
        stopFrameTracking();
        scrollStabilizer?.cleanup();
        panel.style.removeProperty("transition");
        delete panel.dataset.tagConnectionCollapsing;
        delete panel.dataset.scenarioAnimating;
        freezeCollapsedFlowNodeGap(flowNodeBody);
        onFrame?.();
    });
}

export function releaseCollapsedScenarioGap(appRoot, slug) {
    const flowNodeBody = appRoot
        .querySelector(`[data-scenario-toggle="${escapeSelectorValue(slug)}"]`)
        ?.closest(".flow-node__body, .flow-node");
    releaseFlowNodeGapStyles(flowNodeBody);
}

function findScenarioToggle(appRoot, slug) {
    return appRoot.querySelector(`[data-scenario-toggle="${escapeSelectorValue(slug)}"]`);
}

export function createNavigationCollapseScrollStabilizer(panel, navigationBody) {
    if (!shouldStabilizeCollapseScroll(panel, navigationBody)) {
        return null;
    }

    const panelHeight = panel.getBoundingClientRect().height;
    if (!Number.isFinite(panelHeight) || panelHeight <= 0) {
        return null;
    }

    const flowNode = panel.closest(".flow-node");
    const flowList = flowNode?.parentElement;
    if (!flowNode || !flowList) {
        return null;
    }

    const initialScrollTop = navigationBody.scrollTop;
    const spacer = document.createElement("div");
    spacer.dataset.collapseScrollSpacer = "true";
    spacer.setAttribute("aria-hidden", "true");
    spacer.style.height = "0px";
    spacer.style.pointerEvents = "none";
    flowList.append(spacer);

    return {
        update() {
            const currentHeight = panel.getBoundingClientRect().height;
            const collapsedHeight = Number.isFinite(currentHeight)
                ? Math.max(0, panelHeight - currentHeight)
                : 0;
            spacer.style.height = `${collapsedHeight}px`;
            navigationBody.scrollTop = initialScrollTop;
        },
        cleanup() {
            spacer.remove();
            const nextMaxScrollTop = Math.max(0, navigationBody.scrollHeight - navigationBody.clientHeight);
            navigationBody.scrollTop = Math.min(initialScrollTop, nextMaxScrollTop);
        }
    };
}

export function shouldStabilizeCollapseScroll(panel, navigationBody) {
    if (!(panel instanceof HTMLElement) || !(navigationBody instanceof HTMLElement)) {
        return false;
    }

    const flowNode = panel.closest(".flow-node");
    const flowList = flowNode?.parentElement;
    if (!flowNode || !flowList) {
        return false;
    }

    const isLastFlowNode = flowList.lastElementChild === flowNode;
    const isNearBottom = navigationBody.scrollTop + navigationBody.clientHeight >= navigationBody.scrollHeight - 2;
    return isLastFlowNode && isNearBottom;
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

function findScenarioPanel(appRoot, slug) {
    return appRoot.querySelector(`[data-scenario-panel="${escapeSelectorValue(slug)}"]`);
}

function resolveScenarioGapContainer(panel) {
    if (!(panel instanceof HTMLElement)) {
        return null;
    }

    return panel.closest(".flow-node__body") ?? panel.closest(".flow-node");
}

export function resolveScenarioSubtaskEnterAnimationMs(appRoot, slug) {
    if (!(appRoot instanceof HTMLElement) || !slug || prefersReducedMotion()) {
        return 0;
    }

    return measureScenarioSubtaskEnterAnimationMs(findScenarioPanel(appRoot, slug));
}

function createScenarioPanelTransition(durationMs) {
    return [
        `height ${durationMs}ms ${PANEL_LAYOUT_CONFIG.animation.easing}`,
        `opacity ${Math.round(durationMs * 0.7)}ms ease`
    ].join(", ");
}

function createFlowNodeGapTransition(durationMs) {
    return `row-gap ${durationMs}ms ${PANEL_LAYOUT_CONFIG.animation.easing}`;
}

function readFlowNodeGap(flowNode) {
    if (!(flowNode instanceof HTMLElement)) {
        return null;
    }

    const computedStyle = window.getComputedStyle(flowNode);
    const rowGap = computedStyle.rowGap || computedStyle.gap;
    if (!rowGap || rowGap === "normal" || rowGap === "0px") {
        return null;
    }

    return rowGap;
}

function prepareFlowNodeExpansion(flowNode, flowNodeGap) {
    if (!(flowNode instanceof HTMLElement) || !flowNodeGap) {
        return;
    }

    flowNode.style.rowGap = "0px";
    flowNode.style.willChange = "row-gap";
}

function startFlowNodeGapExpansion(flowNode, flowNodeGap, durationMs) {
    if (!(flowNode instanceof HTMLElement) || !flowNodeGap) {
        return;
    }

    flowNode.style.transition = createFlowNodeGapTransition(durationMs);
    flowNode.style.rowGap = flowNodeGap;
}

function prepareFlowNodeCollapse(flowNode, flowNodeGap) {
    if (!(flowNode instanceof HTMLElement) || !flowNodeGap) {
        return;
    }

    flowNode.style.rowGap = flowNodeGap;
    flowNode.style.willChange = "row-gap";
}

function startFlowNodeGapCollapse(flowNode, flowNodeGap, durationMs) {
    if (!(flowNode instanceof HTMLElement) || !flowNodeGap) {
        return;
    }

    flowNode.style.transition = createFlowNodeGapTransition(durationMs);
    flowNode.style.rowGap = "0px";
}

function freezeCollapsedFlowNodeGap(flowNode) {
    if (!(flowNode instanceof HTMLElement)) {
        return;
    }

    flowNode.style.removeProperty("transition");
    flowNode.style.removeProperty("will-change");
}

function releaseFlowNodeGapStyles(flowNode) {
    if (!(flowNode instanceof HTMLElement)) {
        return;
    }

    flowNode.style.removeProperty("row-gap");
    flowNode.style.removeProperty("transition");
    flowNode.style.removeProperty("will-change");
}

function startAnimationFrameTracking(onFrame) {
    if (typeof onFrame !== "function") {
        return () => {
        };
    }

    let frameId = 0;
    let active = true;

    const tick = () => {
        if (!active) {
            return;
        }

        onFrame();
        frameId = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
        active = false;
        if (frameId) {
            window.cancelAnimationFrame(frameId);
        }
    };
}

function waitForScenarioAnimation(panel, durationMs, cleanup) {
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

        const timeoutId = window.setTimeout(finalize, durationMs + 120);
        panel.addEventListener("transitionend", handleTransitionEnd);
    });
}

function resolveScenarioExpansionDuration(panel) {
    return Math.max(
        NAVIGATION_TOGGLE_ANIMATION_MS,
        measureScenarioSubtaskEnterAnimationMs(panel)
    );
}

function measureScenarioSubtaskEnterAnimationMs(panel) {
    if (!(panel instanceof HTMLElement)) {
        return 0;
    }

    let maxEnterIndex = -1;
    panel.querySelectorAll("[data-flow-subtask-enter]").forEach((element) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }

        const rawIndex = element.style.getPropertyValue("--flow-subtask-enter-index");
        const enterIndex = Number.parseFloat(rawIndex);
        if (Number.isFinite(enterIndex)) {
            maxEnterIndex = Math.max(maxEnterIndex, enterIndex);
            return;
        }

        maxEnterIndex = Math.max(maxEnterIndex, 0);
    });

    if (maxEnterIndex < 0) {
        return 0;
    }

    return FLOW_SUBTASK_ENTER_ANIMATION_MS + (maxEnterIndex * FLOW_SUBTASK_ENTER_STAGGER_MS);
}

function measureExpandedPanelHeight(panel) {
    if (!(panel instanceof HTMLElement)) {
        return 0;
    }

    const contentElement = panel.firstElementChild;
    if (contentElement instanceof HTMLElement) {
        return contentElement.getBoundingClientRect().height;
    }

    return panel.scrollHeight;
}

function formatPixelValue(value) {
    if (!Number.isFinite(value) || value <= 0) {
        return "0px";
    }

    return `${value.toFixed(3)}px`;
}

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

import { escapeSelectorValue } from "./dom-helpers.js";

export const NAVIGATION_TOGGLE_ANIMATION_MS = 240;

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
        onFrame?.();
        return Promise.resolve();
    }

    delete panel.dataset.tagConnectionCollapsing;
    panel.style.height = "0px";
    panel.style.opacity = "0";
    panel.style.overflow = "hidden";
    panel.style.willChange = "height, opacity";

    return new Promise((resolve) => {
        let observer = null;
        const stopFrameTracking = startAnimationFrameTracking(onFrame);

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
                stopFrameTracking();
                observer?.disconnect();
                panel.style.removeProperty("height");
                panel.style.removeProperty("opacity");
                panel.style.removeProperty("overflow");
                panel.style.removeProperty("transition");
                panel.style.removeProperty("will-change");
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

    const navigationBody = appRoot.querySelector(".lesson-lane--navigation .lesson-lane__body");
    const scrollStabilizer = createNavigationCollapseScrollStabilizer(panel, navigationBody);

    panel.dataset.tagConnectionCollapsing = "true";
    panel.style.height = `${panel.getBoundingClientRect().height}px`;
    panel.style.opacity = "1";
    panel.style.overflow = "hidden";
    panel.getBoundingClientRect();

    panel.style.transition = createScenarioPanelTransition();
    panel.style.height = "0px";
    panel.style.opacity = "0";

    const stopFrameTracking = startAnimationFrameTracking(() => {
        scrollStabilizer?.update();
        onFrame?.();
    });
    return waitForScenarioAnimation(panel, () => {
        stopFrameTracking();
        scrollStabilizer?.cleanup();
        panel.style.removeProperty("transition");
        delete panel.dataset.tagConnectionCollapsing;
        onFrame?.();
    });
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

function createScenarioPanelTransition() {
    return [
        `height ${NAVIGATION_TOGGLE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        `opacity ${Math.round(NAVIGATION_TOGGLE_ANIMATION_MS * 0.7)}ms ease`
    ].join(", ");
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

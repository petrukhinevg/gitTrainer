import { escapeSelectorValue } from "./dom-helpers.js";

const NAVIGATION_TOGGLE_ANIMATION_MS = 240;
const SMOOTH_WHEEL_SCROLL_DURATION_MS = 180;
const smoothWheelScrollState = new WeakMap();

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

    cancelSmoothWheelScroll(laneBody);
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

export function animateScenarioExpansion(appRoot, slug) {
    const panel = findScenarioPanel(appRoot, slug);
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

export function animateScenarioCollapse(appRoot, slug) {
    const panel = findScenarioPanel(appRoot, slug);
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

function cancelSmoothWheelScroll(element) {
    const existingState = smoothWheelScrollState.get(element);
    if (existingState?.rafId) {
        cancelAnimationFrame(existingState.rafId);
    }

    smoothWheelScrollState.delete(element);
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

function findScenarioPanel(appRoot, slug) {
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

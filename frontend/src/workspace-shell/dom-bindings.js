import { escapeSelectorValue } from "./dom-helpers.js";
import { bindNavigationActiveMarker } from "./navigation-active-marker.js";
import {
    bindNavigationTagConnections,
    redrawNavigationTagConnections
} from "./tag-connection-overlay.js";

const FLOW_SUBTASK_SHIFT_ANIMATION_MS = 260;

export function bindWorkspaceShellDom({
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
}) {
    bindCatalogControls({ applyCatalogControls, resetCatalogControls });
    bindRouteLinks(handleRouteChange);
    bindNavigationVisibilityControl({ appRoot, toggleNavigationVisibility });
    bindNavigationControls({
        appRoot,
        state,
        toggleScenarioExpansion,
        toggleAllNavigationScenarios,
        toggleNavigationTagPin,
        beginNavigationTagHold,
        endNavigationTagHold
    });
    bindPracticeSurfaceControls({
        ensureExerciseSession,
        retryLastSubmission,
        restartExerciseSession,
        revealNextRetryHint,
        handleSubmissionDraftInput,
        handleSubmissionDraftSubmit,
        resetSubmissionDraft
    });
    bindNavigationActiveMarker({
        appRoot,
        onMarkerDragStart: handleNavigationMarkerDragStart,
        onMarkerDragTargetChange: handleNavigationMarkerDragSelection,
        onMarkerDragEnd: handleNavigationMarkerDragEnd
    });
    bindNavigationTagConnections({ appRoot });
}

export function captureDraftFieldSnapshot(field) {
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

export function restoreDraftFieldSnapshot(appRoot, snapshot) {
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

export function preparePinnedNavigationSubtaskUnpinAnimation(appRoot, tag) {
    if (!(appRoot instanceof HTMLElement) || !tag) {
        return;
    }

    const mapRoot = appRoot.querySelector(".lesson-lane--navigation [data-tag-connection-map]");
    if (!(mapRoot instanceof HTMLElement)) {
        return;
    }

    const groups = Array.from(
        mapRoot.querySelectorAll(`.flow-subtask-group[data-flow-subtask-active-tag="${escapeSelectorValue(tag)}"]`)
    ).filter((element) => element instanceof HTMLElement);

    if (groups.length === 0) {
        return;
    }

    groups.forEach((group) => {
        if (typeof group.__flowSubtaskShiftAnimationTimeoutId === "number" && group.__flowSubtaskShiftAnimationTimeoutId) {
            window.clearTimeout(group.__flowSubtaskShiftAnimationTimeoutId);
            group.__flowSubtaskShiftAnimationTimeoutId = 0;
        }

        group.removeAttribute("data-flow-subtask-tag-state-restored");
        group.dataset.flowSubtaskShiftAnimating = "true";
    });

    groups.forEach((group) => {
        void group.offsetWidth;
    });

    groups.forEach((group) => {
        group.__flowSubtaskShiftAnimationTimeoutId = window.setTimeout(() => {
            delete group.dataset.flowSubtaskShiftAnimating;
            group.__flowSubtaskShiftAnimationTimeoutId = 0;
        }, FLOW_SUBTASK_SHIFT_ANIMATION_MS);
    });
}

function bindCatalogControls({ applyCatalogControls, resetCatalogControls }) {
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

function bindRouteLinks(handleRouteChange) {
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

function bindNavigationVisibilityControl({ appRoot, toggleNavigationVisibility }) {
    const button = appRoot.querySelector("[data-navigation-visibility-toggle]");
    if (
        !(button instanceof HTMLElement)
        || button.tagName !== "BUTTON"
        || button.dataset.navigationVisibilityBound === "true"
    ) {
        return;
    }

    button.dataset.navigationVisibilityBound = "true";
    button.addEventListener("click", () => {
        toggleNavigationVisibility();
    });
}

function bindNavigationControls({
    appRoot,
    state,
    toggleScenarioExpansion,
    toggleAllNavigationScenarios,
    toggleNavigationTagPin,
    beginNavigationTagHold,
    endNavigationTagHold
}) {
    const TAG_HOLD_DELAY_MS = 180;
    const tagHoldState = appRoot.__tagLegendHoldState ?? {
        timerId: 0,
        pendingTag: null,
        activeTag: null,
        suppressClickTag: null,
        hoveredTag: null
    };
    appRoot.__tagLegendHoldState = tagHoldState;

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

    document.querySelectorAll("[data-navigation-collapse-all-toggle]").forEach((button) => {
        if (
            !(button instanceof HTMLElement)
            || button.tagName !== "BUTTON"
            || button.dataset.navigationCollapseAllBound === "true"
        ) {
            return;
        }

        button.dataset.navigationCollapseAllBound = "true";
        button.addEventListener("click", () => {
            toggleAllNavigationScenarios();
        });
    });

    const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
    if (!navigationLane) {
        return;
    }

    const applyNavigationHighlight = (hoveredTag = tagHoldState.hoveredTag) => {
        const activeTag = state.heldNavigationTag ?? state.pinnedNavigationTag ?? hoveredTag;
        if (activeTag) {
            navigationLane.dataset.highlightTag = activeTag;
        } else {
            delete navigationLane.dataset.highlightTag;
        }

        if (state.heldNavigationTag) {
            navigationLane.dataset.pinnedTag = state.heldNavigationTag;
        } else if (state.pinnedNavigationTag) {
            navigationLane.dataset.pinnedTag = state.pinnedNavigationTag;
        } else {
            delete navigationLane.dataset.pinnedTag;
        }

        redrawNavigationTagConnections(appRoot);
    };

    const syncNavigationLegendState = () => {
        document.querySelectorAll("[data-tag-legend-control]").forEach((button) => {
            const tag = button.dataset.tagLegendControl;
            const isPinned = Boolean(tag) && state.pinnedNavigationTag === tag;
            const isHeld = Boolean(tag) && state.heldNavigationTag === tag;
            button.classList.toggle("scenario-legend__tag--active", isPinned || isHeld);
            button.setAttribute("aria-pressed", isPinned || isHeld ? "true" : "false");
        });
    };

    const cancelPendingTagHold = () => {
        if (!tagHoldState.timerId) {
            return;
        }

        window.clearTimeout(tagHoldState.timerId);
        tagHoldState.timerId = 0;
    };

    const releaseTagHold = (
        tag = tagHoldState.activeTag ?? tagHoldState.pendingTag,
        { suppressClick = true } = {}
    ) => {
        const normalizedTag = typeof tag === "string" ? tag : null;
        const wasHeld = Boolean(normalizedTag) && tagHoldState.activeTag === normalizedTag;

        cancelPendingTagHold();
        if (normalizedTag && tagHoldState.pendingTag === normalizedTag) {
            tagHoldState.pendingTag = null;
        }

        if (!wasHeld) {
            return;
        }

        tagHoldState.activeTag = null;
        tagHoldState.suppressClickTag = suppressClick ? normalizedTag : null;
        endNavigationTagHold(normalizedTag);
        applyNavigationHighlight();
        syncNavigationLegendState();
    };

    const beginTagHold = (tag) => {
        if (!tag) {
            return;
        }

        cancelPendingTagHold();
        tagHoldState.pendingTag = null;

        if (tagHoldState.activeTag === tag) {
            return;
        }

        tagHoldState.activeTag = tag;
        beginNavigationTagHold(tag);
        applyNavigationHighlight();
        syncNavigationLegendState();
    };

    const toggleTagHold = (tag) => {
        if (!tag) {
            return;
        }

        if (tagHoldState.activeTag === tag) {
            releaseTagHold(tag, { suppressClick: false });
            return;
        }

        if (tagHoldState.activeTag) {
            releaseTagHold(tagHoldState.activeTag, { suppressClick: false });
        }

        beginTagHold(tag);
    };

    const armTagHold = (tag) => {
        if (!tag) {
            return;
        }

        if (tagHoldState.pendingTag && tagHoldState.pendingTag !== tag) {
            releaseTagHold(tagHoldState.pendingTag);
        }

        tagHoldState.pendingTag = tag;
        cancelPendingTagHold();
        tagHoldState.timerId = window.setTimeout(() => {
            tagHoldState.timerId = 0;
            if (tagHoldState.pendingTag !== tag) {
                return;
            }

            beginTagHold(tag);
        }, TAG_HOLD_DELAY_MS);
    };

    applyNavigationHighlight();
    syncNavigationLegendState();
    appRoot.__releaseTagLegendHold = releaseTagHold;

    document.querySelectorAll("[data-tag-legend-control]").forEach((button) => {
        const tag = button.dataset.tagLegendControl;
        if (!tag || button.dataset.tagLegendBound === "true") {
            return;
        }

        button.dataset.tagLegendBound = "true";
        button.addEventListener("mouseenter", () => {
            tagHoldState.hoveredTag = tag;
            applyNavigationHighlight(tag);
        });
        button.addEventListener("mouseleave", () => {
            if (tagHoldState.hoveredTag === tag) {
                tagHoldState.hoveredTag = null;
            }
            if (!tagHoldState.activeTag) {
                applyNavigationHighlight(null);
            }
        });
        button.addEventListener("focus", () => {
            tagHoldState.hoveredTag = tag;
            applyNavigationHighlight(tag);
        });
        button.addEventListener("blur", () => {
            if (tagHoldState.hoveredTag === tag) {
                tagHoldState.hoveredTag = null;
            }
            if (!tagHoldState.activeTag) {
                applyNavigationHighlight(null);
            }
        });
        button.addEventListener("mousedown", (event) => {
            if (event.button !== 1 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
                return;
            }

            event.preventDefault();
            toggleTagHold(tag);
        });
        button.addEventListener("auxclick", (event) => {
            if (event.button !== 1) {
                return;
            }

            event.preventDefault();
        });
        button.addEventListener("touchstart", () => {
            armTagHold(tag);
        }, { passive: true });
        button.addEventListener("touchend", () => {
            releaseTagHold(tag);
        });
        button.addEventListener("touchcancel", () => {
            releaseTagHold(tag);
        });
        button.addEventListener("click", (event) => {
            event.preventDefault();

            if (tagHoldState.suppressClickTag === tag) {
                tagHoldState.suppressClickTag = null;
                return;
            }

            cancelPendingTagHold();
            tagHoldState.pendingTag = null;
            tagHoldState.activeTag = null;
            tagHoldState.suppressClickTag = null;
            if (!state.heldNavigationTag && state.pinnedNavigationTag === tag) {
                preparePinnedNavigationSubtaskUnpinAnimation(appRoot, tag);
            }
            toggleNavigationTagPin(tag);
        });
    });

    if (appRoot.__tagLegendHoldReleaseBound !== true) {
        appRoot.__tagLegendHoldReleaseBound = true;
        window.addEventListener("touchend", () => {
            appRoot.__releaseTagLegendHold?.();
        });
        window.addEventListener("touchcancel", () => {
            appRoot.__releaseTagLegendHold?.();
        });
    }
}

function bindPracticeSurfaceControls({
    ensureExerciseSession,
    retryLastSubmission,
    restartExerciseSession,
    revealNextRetryHint,
    handleSubmissionDraftInput,
    handleSubmissionDraftSubmit,
    resetSubmissionDraft
}) {
    const practiceSurfaceScrollRoot = document.querySelector("[data-practice-surface-scroll]");
    if (
        practiceSurfaceScrollRoot instanceof HTMLElement
        && practiceSurfaceScrollRoot.dataset.practiceSurfaceWheelBound !== "true"
    ) {
        practiceSurfaceScrollRoot.dataset.practiceSurfaceWheelBound = "true";
        practiceSurfaceScrollRoot.addEventListener("wheel", (event) => {
            routePracticeSurfaceWheel(practiceSurfaceScrollRoot, event);
        }, { passive: false });
    }

    const form = document.querySelector("[data-submission-draft-form]");
    if (form && form.dataset.practiceDraftBound !== "true") {
        form.dataset.practiceDraftBound = "true";
        form.addEventListener("input", handleSubmissionDraftInput);
        form.addEventListener("change", handleSubmissionDraftInput);
        form.addEventListener("submit", (event) => {
            void handleSubmissionDraftSubmit(event);
        });
        form.querySelector('textarea[name="answer"]')?.addEventListener("keydown", (event) => {
            if (
                event.key !== "Enter"
                || event.shiftKey
                || event.altKey
                || event.ctrlKey
                || event.metaKey
                || event.isComposing
            ) {
                return;
            }

            event.preventDefault();
            requestFormSubmit(form);
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

function routePracticeSurfaceWheel(scrollRoot, event) {
    if (!(scrollRoot instanceof HTMLElement) || event.defaultPrevented || event.ctrlKey) {
        return;
    }

    const deltaY = normalizeWheelAxis(event.deltaY, event.deltaMode, scrollRoot.clientHeight);
    const deltaX = normalizeWheelAxis(event.deltaX, event.deltaMode, scrollRoot.clientWidth);
    const canScrollVertically = Math.abs(deltaY) > 0 && scrollRoot.scrollHeight > scrollRoot.clientHeight;
    const canScrollHorizontally = Math.abs(deltaX) > 0 && scrollRoot.scrollWidth > scrollRoot.clientWidth;

    if (!canScrollVertically && !canScrollHorizontally) {
        return;
    }

    const nextScrollTop = clampScrollOffset(
        scrollRoot.scrollTop + deltaY,
        0,
        Math.max(0, scrollRoot.scrollHeight - scrollRoot.clientHeight)
    );
    const nextScrollLeft = clampScrollOffset(
        scrollRoot.scrollLeft + deltaX,
        0,
        Math.max(0, scrollRoot.scrollWidth - scrollRoot.clientWidth)
    );

    if (nextScrollTop === scrollRoot.scrollTop && nextScrollLeft === scrollRoot.scrollLeft) {
        return;
    }

    event.preventDefault();
    scrollRoot.scrollTop = nextScrollTop;
    scrollRoot.scrollLeft = nextScrollLeft;
}

function normalizeWheelAxis(delta, deltaMode, viewportSize) {
    if (!Number.isFinite(delta) || delta === 0) {
        return 0;
    }

    switch (deltaMode) {
        case 1:
            return delta * 16;
        case 2:
            return delta * Math.max(viewportSize, 1);
        default:
            return delta;
    }
}

function clampScrollOffset(value, min, max) {
    if (!Number.isFinite(value)) {
        return min;
    }

    return Math.min(Math.max(value, min), max);
}

function requestFormSubmit(form) {
    if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
        return;
    }

    form.dispatchEvent(new Event("submit", {
        bubbles: true,
        cancelable: true
    }));
}

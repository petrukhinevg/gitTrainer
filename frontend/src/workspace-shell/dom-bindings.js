import { escapeSelectorValue } from "./dom-helpers.js";
import {
    bindNavigationTagConnections,
    redrawNavigationTagConnections
} from "./tag-connection-overlay.js";

export function bindWorkspaceShellDom({
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
}) {
    bindCatalogControls({ applyCatalogControls, resetCatalogControls });
    bindRouteLinks(handleRouteChange);
    bindNavigationVisibilityControl({ appRoot, toggleNavigationVisibility });
    bindNavigationControls({ appRoot, state, toggleScenarioExpansion });
    bindPracticeSurfaceControls({
        ensureExerciseSession,
        retryLastSubmission,
        restartExerciseSession,
        revealNextRetryHint,
        handleSubmissionDraftInput,
        handleSubmissionDraftSubmit,
        resetSubmissionDraft
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

function bindNavigationControls({ appRoot, state, toggleScenarioExpansion }) {
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
        const activeTag = state.pinnedNavigationTag ?? hoveredTag;
        if (activeTag) {
            navigationLane.dataset.highlightTag = activeTag;
        } else {
            delete navigationLane.dataset.highlightTag;
        }

        redrawNavigationTagConnections(appRoot);
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

function bindPracticeSurfaceControls({
    ensureExerciseSession,
    retryLastSubmission,
    restartExerciseSession,
    revealNextRetryHint,
    handleSubmissionDraftInput,
    handleSubmissionDraftSubmit,
    resetSubmissionDraft
}) {
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

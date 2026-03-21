import test from "node:test";
import assert from "node:assert/strict";

import {
    parseWorkspaceRoute,
    resetRouteScopedWorkspaceState
} from "../src/workspace-shell/route-orchestration.js";

test("parseWorkspaceRoute извлекает slug и focus из exercise hash", () => {
    assert.deepEqual(
        parseWorkspaceRoute("#/exercise/branch-safety?focus=step-2"),
        {
            name: "exercise",
            scenarioSlug: "branch-safety",
            focus: "step-2"
        }
    );
});

test("parseWorkspaceRoute помечает неизвестный hash как not-found", () => {
    assert.deepEqual(
        parseWorkspaceRoute("#/unexpected"),
        {
            name: "not-found",
            scenarioSlug: null,
            focus: null
        }
    );
});

test("resetRouteScopedWorkspaceState сохраняет session state при повторном входе в тот же exercise route", () => {
    const state = createState({
        route: "exercise",
        selectedScenarioSlug: "branch-safety",
        providerName: "backend-api"
    });
    const originalSubmissionDraft = state.submissionDraft;
    const originalSession = state.session;
    let invalidationCount = 0;

    resetRouteScopedWorkspaceState({
        state,
        previousRoute: "exercise",
        previousScenarioSlug: "branch-safety",
        previousProviderName: "backend-api",
        createInitialSubmissionDraftState: () => ({ marker: "new-draft" }),
        createInitialSessionState: () => ({ marker: "new-session" }),
        createInitialProgressState: () => ({ marker: "new-progress" }),
        invalidateSessionRequests: () => {
            invalidationCount += 1;
        }
    });

    assert.equal(state.submissionDraft, originalSubmissionDraft);
    assert.equal(state.session, originalSession);
    assert.equal(invalidationCount, 0);
});

test("resetRouteScopedWorkspaceState сбрасывает progress и exercise detail при уходе с route", () => {
    const state = createState({
        route: "catalog",
        selectedScenarioSlug: null,
        selectedFocus: "step-2"
    });
    let invalidationCount = 0;

    resetRouteScopedWorkspaceState({
        state,
        previousRoute: "exercise",
        previousScenarioSlug: "branch-safety",
        previousProviderName: "backend-api",
        createInitialSubmissionDraftState: () => ({ marker: "new-draft" }),
        createInitialSessionState: () => ({ marker: "new-session" }),
        createInitialProgressState: () => ({ marker: "new-progress" }),
        invalidateSessionRequests: () => {
            invalidationCount += 1;
        }
    });

    assert.deepEqual(state.submissionDraft, { marker: "new-draft" });
    assert.deepEqual(state.session, { marker: "new-session" });
    assert.deepEqual(state.progress, { marker: "new-progress" });
    assert.equal(state.selectedFocus, null);
    assert.equal(state.detail.status, "idle");
    assert.equal(state.detail.data, null);
    assert.equal(state.detail.error, null);
    assert.equal(invalidationCount, 1);
});

function createState(overrides = {}) {
    return {
        route: "exercise",
        selectedScenarioSlug: "branch-safety",
        selectedFocus: "overview",
        providerName: "backend-api",
        submissionDraft: { marker: "draft" },
        session: { marker: "session" },
        progress: { marker: "progress" },
        detail: {
            status: "ready",
            data: { id: "branch-safety" },
            error: "should-reset"
        },
        ...overrides
    };
}

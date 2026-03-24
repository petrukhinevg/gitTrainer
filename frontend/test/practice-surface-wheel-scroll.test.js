import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { bindWorkspaceShellDom } from "../src/workspace-shell/dom-bindings.js";

test("wheel над вложенной карточкой прокручивает общий контейнер practice surface", () => {
    const dom = new JSDOM(`
        <!doctype html>
        <html>
            <body>
                <div id="app">
                    <section class="lesson-lane lesson-lane--practice panel">
                        <div class="lesson-lane__body">
                            <div class="lesson-lane__scroll-content">
                                <div class="practice-pane practice-pane--surface">
                                    <section class="workspace-card workspace-card--composer" data-practice-surface-scroll>
                                        <div class="practice-composer__scroll practice-composer__scroll--surface">
                                            <div class="practice-output">
                                                <div id="nested-panel">nested</div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </body>
        </html>
    `, { pretendToBeVisual: true });
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const appRoot = dom.window.document.getElementById("app");
        const scrollRoot = appRoot.querySelector("[data-practice-surface-scroll]");
        const nestedPanel = dom.window.document.getElementById("nested-panel");

        Object.defineProperty(scrollRoot, "clientHeight", {
            configurable: true,
            value: 180
        });
        Object.defineProperty(scrollRoot, "scrollHeight", {
            configurable: true,
            value: 720
        });
        scrollRoot.scrollTop = 0;

        bindWorkspaceShellDom({
            appRoot,
            state: {},
            handleRouteChange: () => {},
            handleNavigationMarkerDragStart: () => {},
            handleNavigationMarkerDragSelection: () => {},
            handleNavigationMarkerDragEnd: () => {},
            applyCatalogControls: () => {},
            resetCatalogControls: () => {},
            toggleNavigationVisibility: () => {},
            toggleScenarioExpansion: () => {},
            toggleAllNavigationScenarios: () => {},
            toggleNavigationTagPin: () => {},
            beginNavigationTagHold: () => {},
            endNavigationTagHold: () => {},
            ensureExerciseSession: () => Promise.resolve(),
            retryLastSubmission: () => Promise.resolve(),
            restartExerciseSession: () => Promise.resolve(),
            revealNextRetryHint: () => {},
            handleSubmissionDraftInput: () => {},
            handleSubmissionDraftSubmit: () => Promise.resolve(),
            resetSubmissionDraft: () => {}
        });

        const event = new dom.window.WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            deltaY: 64
        });
        nestedPanel.dispatchEvent(event);

        assert.equal(scrollRoot.scrollTop, 64);
        assert.equal(event.defaultPrevented, true);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

function installDomGlobals(windowLike) {
    const previousGlobals = new Map();
    const bindings = {
        window: windowLike,
        document: windowLike.document,
        HTMLElement: windowLike.HTMLElement,
        HTMLInputElement: windowLike.HTMLInputElement,
        HTMLTextAreaElement: windowLike.HTMLTextAreaElement,
        HTMLSelectElement: windowLike.HTMLSelectElement,
        Event: windowLike.Event
    };

    Object.entries(bindings).forEach(([key, value]) => {
        previousGlobals.set(
            key,
            Object.prototype.hasOwnProperty.call(globalThis, key) ? globalThis[key] : undefined
        );
        globalThis[key] = value;
    });

    return () => {
        Object.keys(bindings).forEach((key) => {
            const previousValue = previousGlobals.get(key);
            if (typeof previousValue === "undefined") {
                delete globalThis[key];
                return;
            }

            globalThis[key] = previousValue;
        });
    };
}

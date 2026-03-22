import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
    captureNavigationFlowBlockTagState,
    restoreNavigationFlowBlockTagState
} from "../src/workspace-shell/controller.js";

test("сохраняет и восстанавливает подсветку сценария и активной подзадачи после ререндера navigation surface", () => {
    const dom = new JSDOM(`<!doctype html><html><body>
        <div data-render-surface="navigation">
            <div class="flow-block-list">
                <section class="flow-node">
                    <button
                        class="flow-block flow-block--toggle flow-block--active"
                        type="button"
                        data-scenario-toggle="branch-safety"
                        data-flow-block-active-tag="branching"
                    >
                        Branch safety
                    </button>
                    <div class="flow-subtask-region" data-scenario-panel="branch-safety">
                        <a
                            class="flow-block flow-block--subtask flow-block--active"
                            href="#/exercise/branch-safety?focus=step-1"
                            data-flow-block-active-tag="branching"
                        >
                            Step 1
                        </a>
                    </div>
                </section>
            </div>
        </div>
    </body></html>`);
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const surfaceRoot = dom.window.document.querySelector('[data-render-surface="navigation"]');
        const preservedState = captureNavigationFlowBlockTagState(surfaceRoot);

        surfaceRoot.innerHTML = `
            <div class="flow-block-list">
                <section class="flow-node">
                    <button
                        class="flow-block flow-block--toggle flow-block--active"
                        type="button"
                        data-scenario-toggle="branch-safety"
                    >
                        Branch safety
                    </button>
                    <div class="flow-subtask-region" data-scenario-panel="branch-safety">
                        <a
                            class="flow-block flow-block--subtask flow-block--active"
                            href="#/exercise/branch-safety?focus=step-1"
                        >
                            Step 1
                        </a>
                    </div>
                </section>
            </div>
        `;

        restoreNavigationFlowBlockTagState(surfaceRoot, preservedState);

        assert.equal(
            surfaceRoot.querySelector('[data-scenario-toggle="branch-safety"]')?.dataset.flowBlockActiveTag,
            "branching"
        );
        assert.equal(
            surfaceRoot.querySelector('[href="#/exercise/branch-safety?focus=step-1"]')?.dataset.flowBlockActiveTag,
            "branching"
        );
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
        CSS: {
            escape(value) {
                return String(value).replace(/"/g, '\\"');
            }
        }
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

import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { preparePinnedNavigationSubtaskUnpinAnimation } from "../src/workspace-shell/dom-bindings.js";

test("left-unpin заранее включает shift-анимацию у активной дочерней группы", async () => {
    const dom = new JSDOM(`
        <!doctype html>
        <html>
            <body>
                <div id="app">
                    <div class="lesson-lane lesson-lane--navigation">
                        <div class="tag-connection-map" data-tag-connection-map>
                            <div
                                class="flow-subtask-group"
                                data-flow-subtask-active-tag="branching"
                                data-flow-subtask-tag-state-restored="true"
                            ></div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `);
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const appRoot = dom.window.document.getElementById("app");
        const subtaskGroup = appRoot.querySelector(".flow-subtask-group");

        preparePinnedNavigationSubtaskUnpinAnimation(appRoot, "branching");

        assert.equal(
            subtaskGroup?.dataset.flowSubtaskShiftAnimating,
            "true",
            "Перед снятием left-pin группа должна получить shift-анимацию"
        );
        assert.equal(
            subtaskGroup?.hasAttribute("data-flow-subtask-tag-state-restored"),
            false,
            "Временный флаг restored не должен выключать transition при left-unpin"
        );

        await new Promise((resolve) => setTimeout(resolve, 300));

        assert.equal(
            subtaskGroup?.hasAttribute("data-flow-subtask-shift-animating"),
            false,
            "После завершения helper должен снять временный shift-флаг"
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
        HTMLElement: windowLike.HTMLElement
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

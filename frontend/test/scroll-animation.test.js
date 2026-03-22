import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
    createNavigationCollapseScrollStabilizer,
    shouldStabilizeCollapseScroll
} from "../src/workspace-shell/scroll-animation.js";

test("включает стабилизацию скролла только для последнего блока у нижней границы панели", () => {
    const dom = new JSDOM(`
        <!doctype html>
        <html>
            <body>
                <div class="lesson-lane lesson-lane--navigation">
                    <div class="lesson-lane__body">
                        <div class="flow-block-list" data-flow-block-list>
                            <section class="flow-node">
                                <div class="flow-subtask-region" data-scenario-panel="first"></div>
                            </section>
                            <section class="flow-node">
                                <div class="flow-subtask-region" data-scenario-panel="last"></div>
                            </section>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `);
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const navigationBody = dom.window.document.querySelector(".lesson-lane__body");
        const firstPanel = dom.window.document.querySelector('[data-scenario-panel="first"]');
        const lastPanel = dom.window.document.querySelector('[data-scenario-panel="last"]');

        defineScrollMetrics(navigationBody, {
            clientHeight: 320,
            scrollHeight: 760
        });
        navigationBody.scrollTop = 440;

        assert.equal(shouldStabilizeCollapseScroll(lastPanel, navigationBody), true);
        assert.equal(shouldStabilizeCollapseScroll(firstPanel, navigationBody), false);

        navigationBody.scrollTop = 380;
        assert.equal(shouldStabilizeCollapseScroll(lastPanel, navigationBody), false);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("стабилизатор удерживает scrollTop во время collapse и удаляет spacer после cleanup", () => {
    const dom = new JSDOM(`
        <!doctype html>
        <html>
            <body>
                <div class="lesson-lane lesson-lane--navigation">
                    <div class="lesson-lane__body">
                        <div class="flow-block-list" data-flow-block-list>
                            <section class="flow-node">
                                <div class="flow-subtask-region" data-scenario-panel="last"></div>
                            </section>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `);
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const navigationBody = dom.window.document.querySelector(".lesson-lane__body");
        const panel = dom.window.document.querySelector('[data-scenario-panel="last"]');
        let scrollHeight = 760;
        let panelHeight = 200;

        defineScrollMetrics(navigationBody, {
            clientHeight: 320,
            getScrollHeight: () => scrollHeight
        });
        navigationBody.scrollTop = 440;
        panel.getBoundingClientRect = () => createRect({ height: panelHeight });

        const stabilizer = createNavigationCollapseScrollStabilizer(panel, navigationBody);
        assert.ok(stabilizer, "Стабилизатор должен создаваться для нижнего последнего блока");
        assert.equal(
            dom.window.document.querySelector("[data-collapse-scroll-spacer]")?.style.height,
            "0px"
        );

        panelHeight = 120;
        navigationBody.scrollTop = 412;
        stabilizer.update();

        assert.equal(navigationBody.scrollTop, 440);
        assert.equal(
            dom.window.document.querySelector("[data-collapse-scroll-spacer]")?.style.height,
            "80px"
        );

        scrollHeight = 540;
        stabilizer.cleanup();

        assert.equal(dom.window.document.querySelector("[data-collapse-scroll-spacer]"), null);
        assert.equal(navigationBody.scrollTop, 220);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

function defineScrollMetrics(element, { clientHeight, scrollHeight, getScrollHeight }) {
    Object.defineProperty(element, "clientHeight", {
        configurable: true,
        get: () => clientHeight
    });
    Object.defineProperty(element, "scrollHeight", {
        configurable: true,
        get: () => (typeof getScrollHeight === "function" ? getScrollHeight() : scrollHeight)
    });
}

function createRect({ height }) {
    return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: height,
        width: 0,
        height
    };
}

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

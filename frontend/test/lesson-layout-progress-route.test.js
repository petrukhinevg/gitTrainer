import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { renderLessonLayout } from "../src/workspace-shell/view/lesson-layout.js";

test("progress route рендерит центральную панель в full-width режиме", () => {
    const markup = renderLessonLayout({
        state: {
            route: "progress",
            panelLayoutMode: "wide",
            isNavigationCollapsed: false,
            isNavigationEffectivelyCollapsed: false,
            isNavigationCollapsing: false,
            isNavigationExpandedReady: true,
            isCompactNavigationVisible: false
        },
        topStrip: "<div>top</div>",
        navigationLane: "<div>navigation</div>",
        lessonLane: "<div>lesson</div>",
        practiceLane: "<div>practice</div>"
    });
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);

    try {
        const layout = dom.window.document.querySelector(".lesson-layout");
        const navigationToggle = dom.window.document.querySelector("[data-navigation-visibility-toggle]");
        const navigationLane = dom.window.document.querySelector("#lesson-navigation-lane");

        assert.ok(layout, "lesson-layout должен рендериться");
        assert.equal(layout.classList.contains("lesson-layout--progress-full-width"), true);
        assert.equal(layout.classList.contains("lesson-layout--practice-hidden"), true);
        assert.equal(navigationToggle?.hasAttribute("hidden"), true);
        assert.equal(navigationToggle?.getAttribute("aria-hidden"), "true");
        assert.equal(navigationLane?.getAttribute("aria-hidden"), "true");
        assert.equal(navigationLane?.hasAttribute("inert"), true);
    } finally {
        dom.window.close();
    }
});

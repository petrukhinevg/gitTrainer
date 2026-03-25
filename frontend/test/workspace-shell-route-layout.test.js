import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { renderCatalogWorkspaceShell } from "../src/workspace-shell/view.js";

test("shell для exercise route сразу резервирует место под правую панель", () => {
    const markup = renderCatalogWorkspaceShell({
        route: "exercise",
        panelLayoutMode: "wide",
        isNavigationCollapsed: false,
        isNavigationEffectivelyCollapsed: false,
        isNavigationCollapsing: false,
        isNavigationExpandedReady: true,
        isCompactNavigationVisible: false
    });
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);

    try {
        const layout = dom.window.document.querySelector(".lesson-layout");

        assert.ok(layout, "shell layout должен быть отрисован");
        assert.equal(
            layout.classList.contains("lesson-layout--practice-hidden"),
            false,
            "Exercise shell не должен сначала монтироваться как полноширинный lesson без правой панели"
        );
        assert.equal(
            layout.classList.contains("lesson-layout--exercise"),
            true
        );
    } finally {
        dom.window.close();
    }
});

import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

import { syncTopStripConstraint } from "../src/workspace-shell/controller.js";

test("navigation toggle в CSS ограничен высотой верхней полосы прогресса", () => {
    const stylesheet = readFileSync(
        new URL("../src/styles/layout.css", import.meta.url),
        "utf8"
    );

    assert.match(
        stylesheet,
        /\.lesson-layout__navigation-toggle\s*\{[\s\S]*position:\s*absolute;[\s\S]*top:\s*var\(--layout-top-strip-height\);/,
        "Navigation toggle должен начинаться ниже top strip, а не поверх него"
    );
    assert.match(
        stylesheet,
        /\.lesson-layout__top\s*\{[\s\S]*width:\s*calc\(100% \+ var\(--navigation-toolbar-height\)\);[\s\S]*margin-left:\s*calc\(-1 \* var\(--navigation-toolbar-height\)\);/,
        "Top strip должен компенсировать ширину navigation toolbar и доходить до края экрана"
    );
});

test("syncTopStripConstraint переносит высоту top strip в layout css variable", () => {
    const dom = new JSDOM(`
        <!doctype html>
        <html>
            <body>
                <section class="lesson-layout">
                    <div class="lesson-layout__top">
                        <div data-render-surface="top-strip">
                            <section class="progress-top-strip"></section>
                        </div>
                    </div>
                </section>
            </body>
        </html>
    `);

    const previousHTMLElement = globalThis.HTMLElement;

    try {
        const layout = dom.window.document.querySelector(".lesson-layout");
        const topStrip = dom.window.document.querySelector(".lesson-layout__top");

        assert.ok(layout instanceof dom.window.HTMLElement);
        assert.ok(topStrip instanceof dom.window.HTMLElement);

        Object.defineProperty(globalThis, "HTMLElement", {
            configurable: true,
            value: dom.window.HTMLElement
        });

        topStrip.getBoundingClientRect = () => ({
            x: 0,
            y: 0,
            top: 0,
            right: 1280,
            bottom: 64,
            left: 0,
            width: 1280,
            height: 64,
            toJSON() {
                return this;
            }
        });

        syncTopStripConstraint(layout);

        assert.equal(layout.style.getPropertyValue("--layout-top-strip-height"), "64px");
    } finally {
        Object.defineProperty(globalThis, "HTMLElement", {
            configurable: true,
            value: previousHTMLElement
        });
        dom.window.close();
    }
});

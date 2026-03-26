import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("правая колонка не зажимает practice stack по фиксированной высоте и позволяет outer scroll", () => {
    const stylesheet = readFileSync(
        new URL("../src/styles/workspace.css", import.meta.url),
        "utf8"
    );

    assert.match(
        stylesheet,
        /\.practice-stack\s*\{[\s\S]*height:\s*auto;[\s\S]*grid-template-rows:\s*minmax\(var\(--practice-viewer-height\), auto\) auto;[\s\S]*overflow:\s*visible;/,
        "Practice stack не должен быть зажат по высоте viewport-области"
    );
    assert.match(
        stylesheet,
        /\.lesson-lane--practice \.lesson-lane__scroll-content\s*\{[\s\S]*height:\s*auto;[\s\S]*min-height:\s*100%;/,
        "Правая колонка должна позволять контенту вырастать выше viewport и прокручиваться целиком"
    );
});

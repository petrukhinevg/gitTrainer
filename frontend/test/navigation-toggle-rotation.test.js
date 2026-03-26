import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("toggle левой панели вращает стрелку полным кругом вокруг центра", () => {
    const stylesheet = readFileSync(
        new URL("../src/styles/layout.css", import.meta.url),
        "utf8"
    );

    assert.match(
        stylesheet,
        /\.lesson-layout__navigation-toggle-icon\s*\{[\s\S]*display:\s*inline-grid;[\s\S]*transform-origin:\s*50% 50%;[\s\S]*transition:\s*transform 320ms var\(--panel-motion-easing\);/,
        "Стрелка toggle должна вращаться вокруг собственного центра"
    );
    assert.match(
        stylesheet,
        /\.lesson-layout__navigation-toggle\[aria-expanded="true"\] \.lesson-layout__navigation-toggle-icon\s*\{[\s\S]*transform:\s*rotate\(-360deg\);/,
        "При раскрытии/скрытии панели стрелка должна делать полный оборот"
    );
});

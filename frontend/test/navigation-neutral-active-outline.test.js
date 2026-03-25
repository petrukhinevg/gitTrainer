import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("нетегированные выбранные дочерние navigation blocks получают более заметную обводку", () => {
    const stylesheet = readFileSync(
        new URL("../src/styles/catalog.css", import.meta.url),
        "utf8"
    );

    assert.match(
        stylesheet,
        /\.flow-block--subtask\.flow-block--active:not\(\[data-flow-block-active-tag\]\)\s*\{[\s\S]*border-color:\s*rgba\(31,\s*23,\s*32,\s*0\.38\);[\s\S]*box-shadow:\s*inset 0 0 0 1px rgba\(31,\s*23,\s*32,\s*0\.16\);/,
        "Выбранные нейтральные дочерние блоки должны иметь более заметную обводку по толщине, как у акцентных блоков"
    );
});

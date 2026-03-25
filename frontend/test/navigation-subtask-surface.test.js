import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("нетегированные subtask blocks чуть светлее parent blocks", () => {
    const stylesheet = readFileSync(
        new URL("../src/styles/catalog.css", import.meta.url),
        "utf8"
    );

    assert.match(
        stylesheet,
        /\.flow-block--subtask\s*\{[\s\S]*background:\s*color-mix\(in srgb,\s*var\(--shell-flow-block-surface\)\s*88%,\s*rgba\(255,\s*250,\s*241,\s*0\.9\)\);/,
        "Нетегированные дочерние блоки должны быть только немного светлее parent blocks, а не почти белыми"
    );
});

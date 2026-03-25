import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("первые три верхних navigation blocks получают очень широкие диагональные полосы с близкими оттенками", () => {
    const stylesheet = readFileSync(
        new URL("../src/styles/catalog.css", import.meta.url),
        "utf8"
    );

    assert.match(
        stylesheet,
        /\.flow-block-list\s*>\s*\.flow-block:nth-child\(-n \+ 3\)\s*\{[\s\S]*repeating-linear-gradient\(\s*-60deg,\s*rgba\([^)]+\)\s*0 12px,\s*rgba\([^)]+\)\s*12px 24px\s*\)/,
        "Первые три блока левой панели должны иметь очень широкие наклонные полосы с шагом 12px и двумя близкими цветами"
    );
    assert.match(
        stylesheet,
        /\.flow-block-list\s*>\s*\.flow-block:nth-child\(-n \+ 3\)\.flow-block--active:not\(\[data-flow-block-active-tag\]\)\s*\{/,
        "Активное состояние первых трёх блоков тоже должно сохранять полосатую заливку"
    );
    assert.match(
        stylesheet,
        /\.flow-block-list\s*>\s*\.flow-block:nth-child\(-n \+ 3\):hover,[\s\S]*background-color:\s*rgba\(255,\s*250,\s*241,\s*0\.96\);[\s\S]*background-image:\s*none;/,
        "На hover первые три блока должны переходить в тот же фон, что и родительские task blocks"
    );
});

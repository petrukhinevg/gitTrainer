import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("все navigation blocks подсвечиваются белым фоном на hover", () => {
    const stylesheet = readFileSync(
        new URL("../src/styles/catalog.css", import.meta.url),
        "utf8"
    );

    assert.match(
        stylesheet,
        /\.flow-block:hover,\s*\.flow-block\.flow-block--active:hover,[\s\S]*background:\s*rgba\(255,\s*250,\s*241,\s*0\.96\);/,
        "Hover для navigation blocks должен совпадать по заливке с блоком справки по тегам"
    );
    assert.match(
        stylesheet,
        /\.flow-block:active,\s*\.flow-block\.flow-block--active:active,[\s\S]*\.flow-block--active:not\(\[data-flow-block-active-tag\]\):active[\s\S]*background:\s*rgba\(255,\s*250,\s*241,\s*0\.96\);/,
        "Active-состояние navigation blocks тоже должно совпадать по заливке с блоком справки по тегам"
    );
});

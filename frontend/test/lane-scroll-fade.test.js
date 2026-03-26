import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("scroll-body всех колонок получает плавное угасание сверху и снизу", () => {
    const stylesheet = readFileSync(
        new URL("../src/styles/layout.css", import.meta.url),
        "utf8"
    );

    assert.match(
        stylesheet,
        /\.lesson-lane__body\s*\{[\s\S]*padding-top:\s*var\(--lesson-lane-scroll-fade-size\);[\s\S]*-webkit-mask-image:\s*linear-gradient\([\s\S]*transparent 0,[\s\S]*#000 var\(--lesson-lane-scroll-fade-size\),[\s\S]*#000 calc\(100% - var\(--lesson-lane-scroll-fade-size\)\),[\s\S]*transparent 100%[\s\S]*\);/,
        "Scroll-body каждой колонки должен получать плавное угасание по верхнему и нижнему краю"
    );
});

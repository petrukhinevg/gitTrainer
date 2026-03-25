import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("терминальный prompt жирнее placeholder у поля ввода", () => {
    const stylesheet = readFileSync(
        new URL("../src/styles/workspace.css", import.meta.url),
        "utf8"
    );

    assert.match(
        stylesheet,
        /\.workspace-console__prompt,\s*\.workspace-terminal__prompt\s*\{[\s\S]*font-weight:\s*700;/,
        "Символ prompt должен иметь более жирное начертание"
    );
    assert.match(
        stylesheet,
        /\.workspace-terminal__input::placeholder\s*\{[\s\S]*font-weight:\s*400;/,
        "Placeholder поля ввода должен быть визуально легче prompt"
    );
});

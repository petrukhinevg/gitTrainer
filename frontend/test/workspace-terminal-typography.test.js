import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function getRule(stylesheet, selector) {
    const selectorIndex = stylesheet.indexOf(selector);

    assert.notEqual(selectorIndex, -1, `Не найден CSS-блок ${selector}`);

    const ruleEndIndex = stylesheet.indexOf("}", selectorIndex);

    assert.notEqual(ruleEndIndex, -1, `Не найдено окончание CSS-блока ${selector}`);

    return stylesheet.slice(selectorIndex, ruleEndIndex + 1);
}

test("терминальный prompt жирнее placeholder у поля ввода", () => {
    const stylesheet = readFileSync(
        new URL("../src/styles/workspace.css", import.meta.url),
        "utf8"
    );
    const promptRule = getRule(stylesheet, ".workspace-console__prompt,\n.workspace-terminal__prompt");
    const placeholderRule = getRule(stylesheet, ".workspace-terminal__input::placeholder");

    assert.match(
        promptRule,
        /font-weight:\s*700;/,
        "Символ prompt должен иметь более жирное начертание"
    );
    assert.match(
        placeholderRule,
        /font-weight:\s*400;/,
        "Placeholder поля ввода должен быть визуально легче prompt"
    );
});

import test from "node:test";
import assert from "node:assert/strict";

import { shouldResetLessonScrollForRouteChange } from "../src/workspace-shell/route-scroll-policy.js";

test("не сбрасывает lesson scroll, когда выбранный пункт не меняется", () => {
    assert.equal(
        shouldResetLessonScrollForRouteChange({
            previousRoute: "exercise",
            previousScenarioSlug: "branch-safety",
            previousSelectedFocus: "step-1",
            nextRoute: "exercise",
            nextScenarioSlug: "branch-safety",
            nextSelectedFocus: "step-1"
        }),
        false
    );
});

test("сбрасывает lesson scroll при переходе на другой шаг того же сценария", () => {
    assert.equal(
        shouldResetLessonScrollForRouteChange({
            previousRoute: "exercise",
            previousScenarioSlug: "branch-safety",
            previousSelectedFocus: "step-1",
            nextRoute: "exercise",
            nextScenarioSlug: "branch-safety",
            nextSelectedFocus: "step-2"
        }),
        true
    );
});

test("сбрасывает lesson scroll при переходе на другой сценарий", () => {
    assert.equal(
        shouldResetLessonScrollForRouteChange({
            previousRoute: "exercise",
            previousScenarioSlug: "branch-safety",
            previousSelectedFocus: "overview",
            nextRoute: "exercise",
            nextScenarioSlug: "status-basics",
            nextSelectedFocus: "overview"
        }),
        true
    );
});

test("сбрасывает lesson scroll при переходе между экранами каталога и прогресса", () => {
    assert.equal(
        shouldResetLessonScrollForRouteChange({
            previousRoute: "catalog",
            previousScenarioSlug: null,
            previousSelectedFocus: null,
            nextRoute: "progress",
            nextScenarioSlug: null,
            nextSelectedFocus: null
        }),
        true
    );
});

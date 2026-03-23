import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { renderCatalogWorkspaceShell } from "../src/workspace-shell/view.js";
import { renderSidebarPanelContent } from "../src/workspace-shell/view/sidebar-panel.js";
import {
    bindNavigationActiveMarker,
    describeNavigationMarkerTarget,
    redrawNavigationActiveMarker,
    resolveNavigationActiveMarkerMotionDuration,
    resolveNavigationMarkerDragTarget,
    resolveNavigationActiveMarkerTarget,
    syncNavigationMarkerTarget
} from "../src/workspace-shell/navigation-active-marker.js";

test("навигационная панель рендерит rail для активного маркера", () => {
    const markup = renderCatalogWorkspaceShell();
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);

    try {
        const document = dom.window.document;
        assert.ok(document.querySelector("[data-navigation-active-marker-shell]"));
        assert.ok(document.querySelector("[data-navigation-active-marker]"));
    } finally {
        dom.window.close();
    }
});

test("маркер выбирает активную подзадачу приоритетнее активного сценария и обновляет позицию", () => {
    const dom = new JSDOM(createMarkerFixture(), { pretendToBeVisual: true });
    const { window } = dom;
    const restoreGlobals = installNavigationMarkerGlobals(window);

    try {
        const appRoot = window.document.querySelector("[data-app-root]");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const marker = appRoot.querySelector("[data-navigation-active-marker]");
        const scenarioToggle = appRoot.querySelector("[data-scenario-toggle]");
        const subtaskLink = appRoot.querySelector("[data-scenario-focus]");

        assignRect(mapRoot, createRect(0, 40, 280, 520));
        assignRect(scenarioToggle, createRect(24, 120, 220, 52));
        assignRect(subtaskLink, createRect(40, 236, 204, 46));

        bindNavigationActiveMarker({ appRoot });
        flushRafQueue(window);

        assert.equal(resolveNavigationActiveMarkerTarget(mapRoot), subtaskLink);
        assert.equal(marker.dataset.visible, "true");
        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-top"), "196px");
        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-height"), "46px");

        subtaskLink.classList.remove("flow-block--active");
        redrawNavigationActiveMarker(appRoot, { instant: true });
        flushRafQueue(window);

        assert.equal(resolveNavigationActiveMarkerTarget(mapRoot), scenarioToggle);
        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-top"), "80px");
        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-height"), "52px");
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("маркер следует за явно выбранной целью и не зависит от active-классов", () => {
    const dom = new JSDOM(createMarkerFixtureWithSiblingScenario(), { pretendToBeVisual: true });
    const { window } = dom;
    const restoreGlobals = installNavigationMarkerGlobals(window);

    try {
        const appRoot = window.document.querySelector("[data-app-root]");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const marker = appRoot.querySelector("[data-navigation-active-marker]");
        const activeSubtaskLink = appRoot.querySelector('[data-scenario-focus="step-1"]');
        const remoteScenarioToggle = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');

        assignRect(mapRoot, createRect(0, 40, 280, 520));
        assignRect(activeSubtaskLink, createRect(40, 236, 204, 46));
        assignRect(remoteScenarioToggle, createRect(24, 320, 220, 52));

        syncNavigationMarkerTarget({
            mapRoot,
            route: "exercise",
            selectedScenarioSlug: "branch-safety",
            selectedFocus: "step-1"
        });
        bindNavigationActiveMarker({ appRoot });
        flushRafQueue(window);

        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-top"), "196px");
        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-height"), "46px");

        activeSubtaskLink.classList.remove("flow-block--active");
        remoteScenarioToggle.classList.add("flow-block--active");
        syncNavigationMarkerTarget({
            mapRoot,
            route: "exercise",
            selectedScenarioSlug: "branch-safety",
            selectedFocus: "step-1"
        });
        redrawNavigationActiveMarker(appRoot);
        flushRafQueue(window);

        assert.equal(resolveNavigationActiveMarkerTarget(mapRoot), activeSubtaskLink);
        assert.equal(marker.dataset.visible, "true");
        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-top"), "196px");
        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-height"), "46px");
        assert.equal(activeSubtaskLink.dataset.navigationMarkerTarget, "true");
        assert.equal(remoteScenarioToggle.hasAttribute("data-navigation-marker-target"), false);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("drag-резолвер выбирает ближайший блок по вертикали, даже если курсор между карточками", () => {
    const dom = new JSDOM(createMarkerFixtureWithSiblingScenario(), { pretendToBeVisual: true });
    const { window } = dom;
    const restoreGlobals = installNavigationMarkerGlobals(window);

    try {
        const appRoot = window.document.querySelector("[data-app-root]");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const firstScenarioToggle = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const secondScenarioToggle = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');

        assignRect(firstScenarioToggle, createRect(24, 120, 220, 52));
        assignRect(secondScenarioToggle, createRect(24, 320, 220, 52));

        assert.equal(resolveNavigationMarkerDragTarget({ mapRoot, clientY: 150 }), firstScenarioToggle);
        assert.equal(resolveNavigationMarkerDragTarget({ mapRoot, clientY: 274 }), secondScenarioToggle);
        assert.equal(resolveNavigationMarkerDragTarget({ mapRoot, clientY: 410 }), secondScenarioToggle);
        assert.deepEqual(describeNavigationMarkerTarget(secondScenarioToggle), {
            kind: "scenario-toggle",
            key: "remote-sync-preview"
        });
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("drag-резолвер использует snapshot родительских блоков и не учитывает временно скрытые подзадачи", () => {
    const dom = new JSDOM(createMarkerFixtureWithSiblingScenario(), { pretendToBeVisual: true });
    const { window } = dom;
    const restoreGlobals = installNavigationMarkerGlobals(window);

    try {
        const appRoot = window.document.querySelector("[data-app-root]");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const branchScenarioToggle = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const remoteScenarioToggle = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');

        assignRect(branchScenarioToggle, createRect(24, 120, 220, 52));
        assignRect(remoteScenarioToggle, createRect(24, 320, 220, 52));

        const dragSnapshot = [
            {
                descriptor: describeNavigationMarkerTarget(branchScenarioToggle),
                top: 120,
                bottom: 172,
                centerY: 146
            },
            {
                descriptor: describeNavigationMarkerTarget(remoteScenarioToggle),
                top: 320,
                bottom: 372,
                centerY: 346
            }
        ];

        const preservedTarget = resolveNavigationMarkerDragTarget({
            mapRoot,
            clientY: 300,
            dragSnapshot
        });

        assignRect(remoteScenarioToggle, createRect(24, 520, 220, 52));
        const movedLayoutTarget = resolveNavigationMarkerDragTarget({
            mapRoot,
            clientY: 346,
            dragSnapshot
        });

        assert.equal(preservedTarget, remoteScenarioToggle);
        assert.equal(movedLayoutTarget, remoteScenarioToggle);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("drag между сценариями оставляет анимацию маркера включенной и помечает preview-цель", () => {
    const dom = new JSDOM(createMarkerFixtureWithSiblingScenario(), { pretendToBeVisual: true });
    const { window } = dom;
    const restoreGlobals = installNavigationMarkerGlobals(window);

    try {
        const appRoot = window.document.querySelector("[data-app-root]");
        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const marker = appRoot.querySelector("[data-navigation-active-marker]");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const firstScenarioToggle = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const secondScenarioToggle = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');

        assignRect(mapRoot, createRect(0, 40, 280, 520));
        assignRect(firstScenarioToggle, createRect(24, 120, 220, 52));
        assignRect(secondScenarioToggle, createRect(24, 320, 220, 52));

        bindNavigationActiveMarker({ appRoot });
        flushRafQueue(window);

        marker.dispatchEvent(new window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientY: 146
        }));
        window.dispatchEvent(new window.MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            buttons: 1,
            clientY: 346
        }));
        flushRafQueue(window);

        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-top"), "280px");
        assert.equal(marker.classList.contains("navigation-flow-rail__marker--instant"), false);
        assert.equal(navigationLane.dataset.markerDragging, "true");
        assert.equal(secondScenarioToggle.dataset.navigationMarkerPreviewTarget, "true");

        window.dispatchEvent(new window.MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientY: 346
        }));
        flushRafQueue(window);

        assert.equal(navigationLane.hasAttribute("data-marker-dragging"), false);
        assert.equal(secondScenarioToggle.hasAttribute("data-navigation-marker-preview-target"), false);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("обычный redraw не должен терять анимацию из-за instant redraw в том же кадре", () => {
    const dom = new JSDOM(createMarkerFixture(), { pretendToBeVisual: true });
    const { window } = dom;
    const restoreGlobals = installNavigationMarkerGlobals(window);

    try {
        const appRoot = window.document.querySelector("[data-app-root]");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const marker = appRoot.querySelector("[data-navigation-active-marker]");
        const scenarioToggle = appRoot.querySelector("[data-scenario-toggle]");
        const subtaskLink = appRoot.querySelector("[data-scenario-focus]");

        assignRect(mapRoot, createRect(0, 40, 280, 520));
        assignRect(scenarioToggle, createRect(24, 120, 220, 52));
        assignRect(subtaskLink, createRect(40, 236, 204, 46));

        bindNavigationActiveMarker({ appRoot });
        flushRafQueue(window);

        subtaskLink.classList.remove("flow-block--active");
        redrawNavigationActiveMarker(appRoot);
        redrawNavigationActiveMarker(appRoot, { instant: true });
        flushRafQueue(window);

        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-top"), "80px");
        assert.equal(marker.classList.contains("navigation-flow-rail__marker--instant"), false);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("длинный переход маркера получает более длинную анимацию, чем короткий", () => {
    const shortDuration = resolveNavigationActiveMarkerMotionDuration(
        { visible: true, top: 80, height: 46 },
        { visible: true, top: 120, height: 46 }
    );
    const longDuration = resolveNavigationActiveMarkerMotionDuration(
        { visible: true, top: 80, height: 46 },
        { visible: true, top: 420, height: 46 }
    );

    assert.ok(longDuration > shortDuration);
    assert.equal(shortDuration, 278);
    assert.equal(longDuration, 563);
});

test("повторный bind на том же navigation DOM переиспользует маркер и не сбрасывает анимацию", () => {
    const dom = new JSDOM(createMarkerFixtureWithSiblingScenario(), { pretendToBeVisual: true });
    const { window } = dom;
    const restoreGlobals = installNavigationMarkerGlobals(window);

    try {
        const appRoot = window.document.querySelector("[data-app-root]");
        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const marker = appRoot.querySelector("[data-navigation-active-marker]");
        const firstStep = appRoot.querySelector('[data-scenario-focus="step-1"]');
        const secondScenarioToggle = appRoot.querySelector('[data-scenario-toggle="remote-sync-preview"]');

        assignRect(mapRoot, createRect(0, 40, 280, 520));
        assignRect(firstStep, createRect(40, 236, 204, 46));
        assignRect(secondScenarioToggle, createRect(24, 320, 220, 52));

        syncNavigationMarkerTarget({
            mapRoot,
            route: "exercise",
            selectedScenarioSlug: "branch-safety",
            selectedFocus: "step-1"
        });
        bindNavigationActiveMarker({ appRoot });
        flushRafQueue(window);

        const redrawBefore = navigationLane.__redrawNavigationActiveMarker;

        syncNavigationMarkerTarget({
            mapRoot,
            route: "exercise",
            selectedScenarioSlug: "remote-sync-preview",
            selectedFocus: null
        });
        bindNavigationActiveMarker({ appRoot });
        flushRafQueue(window);

        assert.equal(navigationLane.__redrawNavigationActiveMarker, redrawBefore);
        assert.equal(marker.style.getPropertyValue("--navigation-active-marker-top"), "280px");
        assert.equal(marker.classList.contains("navigation-flow-rail__marker--instant"), false);
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

function createReadyState() {
    return {
        route: "exercise",
        providerName: "backend-api",
        catalog: {
            status: "ready",
            items: [
                {
                    slug: "branch-safety",
                    title: "Подтверди текущую ветку",
                    tags: ["branching", "navigation"]
                }
            ]
        },
        expandedScenarioSlugs: ["branch-safety"],
        expandingScenarioSlug: null,
        selectedScenarioSlug: "branch-safety",
        selectedFocus: "step-1",
        pinnedNavigationTag: null,
        detail: {
            status: "ready",
            scenarioSlug: "branch-safety",
            error: null,
            data: {
                workspace: {
                    task: {
                        steps: [
                            {
                                position: 1,
                                title: "Проверь ветку"
                            }
                        ]
                    }
                }
            }
        },
        detailCache: {
            "branch-safety": {
                status: "ready",
                error: null,
                data: {
                    workspace: {
                        task: {
                            steps: [
                                {
                                    position: 1,
                                    title: "Проверь ветку"
                                }
                            ]
                        }
                    }
                }
            }
        }
    };
}

function createMarkerFixture() {
    return `
        <!doctype html>
        <html>
            <body>
                <div data-app-root>
                    <section class="lesson-layout lesson-layout--exercise">
                        <section class="lesson-lane lesson-lane--navigation">
                            <div class="lesson-lane__body">
                                <div class="lesson-lane__scroll-content">
                                    <div class="tag-connection-map" data-tag-connection-map>
                                        <div class="navigation-flow-rail" aria-hidden="true">
                                            <span class="navigation-flow-rail__line"></span>
                                            <span class="navigation-flow-rail__marker" data-navigation-active-marker></span>
                                        </div>
                                        <div class="flow-block-list" data-flow-block-list>
                                            <section class="flow-node">
                                                <button
                                                    class="flow-block flow-block--toggle flow-block--active"
                                                    type="button"
                                                    data-scenario-toggle="branch-safety"
                                                >
                                                    <strong class="flow-block__title">Сценарий</strong>
                                                </button>
                                                <div class="flow-subtask-region" data-scenario-panel="branch-safety">
                                                    <div class="flow-subtask-group">
                                                        <a
                                                            class="flow-block flow-block--subtask flow-block--active"
                                                            href="#/exercise/branch-safety?focus=step-1"
                                                            data-scenario-focus="step-1"
                                                        >
                                                            <strong class="flow-block__title">Подзадача</strong>
                                                        </a>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </section>
                </div>
            </body>
        </html>
    `;
}

function createMarkerFixtureWithSiblingScenario() {
    return `
        <!doctype html>
        <html>
            <body>
                <div data-app-root>
                    <section class="lesson-layout lesson-layout--exercise">
                        <section class="lesson-lane lesson-lane--navigation">
                            <div class="lesson-lane__body">
                                <div class="lesson-lane__scroll-content">
                                    <div class="tag-connection-map" data-tag-connection-map>
                                        <div class="navigation-flow-rail" aria-hidden="true">
                                            <span class="navigation-flow-rail__line"></span>
                                            <span class="navigation-flow-rail__marker" data-navigation-active-marker></span>
                                        </div>
                                        <div class="flow-block-list" data-flow-block-list>
                                            <section class="flow-node">
                                                <button
                                                    class="flow-block flow-block--toggle flow-block--active"
                                                    type="button"
                                                    data-scenario-toggle="branch-safety"
                                                >
                                                    <strong class="flow-block__title">Сценарий 1</strong>
                                                </button>
                                                <div class="flow-subtask-region" data-scenario-panel="branch-safety">
                                                    <div class="flow-subtask-group">
                                                        <a
                                                            class="flow-block flow-block--subtask flow-block--active"
                                                            href="#/exercise/branch-safety?focus=step-1"
                                                            data-scenario-focus="step-1"
                                                        >
                                                            <strong class="flow-block__title">Подзадача</strong>
                                                        </a>
                                                    </div>
                                                </div>
                                            </section>
                                            <section class="flow-node">
                                                <button
                                                    class="flow-block flow-block--toggle"
                                                    type="button"
                                                    data-scenario-toggle="remote-sync-preview"
                                                >
                                                    <strong class="flow-block__title">Сценарий 2</strong>
                                                </button>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </section>
                </div>
            </body>
        </html>
    `;
}

function installNavigationMarkerGlobals(window) {
    const previousWindow = global.window;
    const previousDocument = global.document;
    const previousHTMLElement = global.HTMLElement;
    const previousRequestAnimationFrame = global.requestAnimationFrame;
    const previousCancelAnimationFrame = global.cancelAnimationFrame;
    const rafQueue = [];
    let nextRafId = 0;

    global.window = window;
    global.document = window.document;
    global.HTMLElement = window.HTMLElement;
    global.requestAnimationFrame = (callback) => {
        const id = ++nextRafId;
        rafQueue.push({ id, callback });
        return id;
    };
    global.cancelAnimationFrame = (id) => {
        const entryIndex = rafQueue.findIndex((entry) => entry.id === id);
        if (entryIndex >= 0) {
            rafQueue.splice(entryIndex, 1);
        }
    };
    window.requestAnimationFrame = global.requestAnimationFrame;
    window.cancelAnimationFrame = global.cancelAnimationFrame;
    window.__testNavigationMarkerRafQueue = rafQueue;

    return () => {
        global.window = previousWindow;
        global.document = previousDocument;
        global.HTMLElement = previousHTMLElement;
        global.requestAnimationFrame = previousRequestAnimationFrame;
        global.cancelAnimationFrame = previousCancelAnimationFrame;
    };
}

function flushRafQueue(window) {
    const rafQueue = window.__testNavigationMarkerRafQueue ?? [];

    while (rafQueue.length > 0) {
        const { callback } = rafQueue.shift();
        callback();
    }
}

function createRect(left, top, width, height) {
    return {
        x: left,
        y: top,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height
    };
}

function assignRect(element, rect) {
    Object.defineProperty(element, "getBoundingClientRect", {
        configurable: true,
        value: () => rect
    });
}

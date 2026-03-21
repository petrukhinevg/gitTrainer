import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
    bindNavigationTagConnections,
    buildAnchoredConnectionGeometry,
    buildContinuousConnectionPath,
    buildTagConnectionGeometry,
    redrawNavigationTagConnections
} from "../src/workspace-shell/tag-connection-overlay.js";

test("строит левостороннюю ломаную для тега из левой части легенды", () => {
    const geometry = buildTagConnectionGeometry({
        rootRect: createRect(0, 0, 280, 640),
        buttonRect: createRect(24, 20, 96, 28),
        targetRects: [
            createRect(20, 120, 216, 52),
            createRect(34, 178, 202, 46)
        ]
    });

    assert.equal(geometry.side, "left");
    assert.equal(geometry.targets.length, 2);
    assert.ok(geometry.trunkX < geometry.start.x);
    assert.ok(geometry.targets.every((target) => target.x >= geometry.trunkX));
    assert.ok(geometry.trunkBottom > geometry.trunkTop);
});

test("строит правостороннюю ломаную для тега из правой части легенды", () => {
    const geometry = buildTagConnectionGeometry({
        rootRect: createRect(0, 0, 280, 640),
        buttonRect: createRect(138, 20, 102, 28),
        targetRects: [
            createRect(20, 120, 216, 52),
            createRect(34, 178, 202, 46),
            createRect(34, 232, 202, 46)
        ]
    });

    assert.equal(geometry.side, "right");
    assert.equal(geometry.targets.length, 3);
    assert.ok(geometry.trunkX > geometry.start.x);
    assert.ok(geometry.targets.every((target) => target.x < geometry.trunkX));
    assert.ok(geometry.trunkBottom >= geometry.targets.at(-1).y);
});

test("сохраняет правую ориентацию тега при канвасе шире левой панели", () => {
    const sideReferenceRect = createRect(0, 0, 280, 640);
    const geometry = buildTagConnectionGeometry({
        rootRect: createRect(0, 0, 1200, 640),
        sideReferenceRect,
        buttonRect: createRect(138, 20, 102, 28),
        targetRects: [
            createRect(40, 120, 236, 52),
            createRect(48, 178, 228, 46)
        ]
    });

    assert.equal(geometry.side, "right");
    assert.ok(geometry.targets[0].x > geometry.start.x);
    assert.ok(geometry.targets[0].x < geometry.trunkX);
    assert.ok(geometry.trunkX > geometry.start.x);
});

test("при точном попадании тега в середину панели выбирает правую ориентацию", () => {
    const geometry = buildTagConnectionGeometry({
        rootRect: createRect(0, 0, 280, 640),
        sideReferenceRect: createRect(0, 0, 280, 640),
        buttonRect: createRect(96, 20, 88, 28),
        targetRects: [
            createRect(20, 120, 216, 52),
            createRect(34, 178, 202, 46)
        ]
    });

    assert.equal(geometry.side, "right");
    assert.ok(geometry.trunkX > geometry.start.x);
});

test("строит вторичную ветку справа от родительского блока к дочерним задачам", () => {
    const geometry = buildAnchoredConnectionGeometry({
        rootRect: createRect(0, 0, 320, 640),
        anchorRect: createRect(24, 120, 220, 52),
        targetRects: [
            createRect(40, 184, 204, 46),
            createRect(40, 236, 204, 46)
        ],
        side: "right"
    });

    assert.equal(geometry.side, "right");
    assert.equal(geometry.targets.length, 2);
    assert.ok(geometry.trunkX > geometry.start.x);
    assert.ok(geometry.targets.every((target) => target.x < geometry.trunkX));
});

test("вторичные ветки получают разные горизонтальные отступы и не слипаются", () => {
    const firstGeometry = buildAnchoredConnectionGeometry({
        rootRect: createRect(0, 0, 320, 640),
        anchorRect: createRect(24, 120, 220, 52),
        targetRects: [
            createRect(40, 184, 204, 46),
            createRect(40, 236, 204, 46)
        ],
        side: "right",
        trunkOffsetPx: 14
    });
    const secondGeometry = buildAnchoredConnectionGeometry({
        rootRect: createRect(0, 0, 320, 640),
        anchorRect: createRect(24, 280, 220, 52),
        targetRects: [
            createRect(40, 344, 204, 46),
            createRect(40, 396, 204, 46)
        ],
        side: "right",
        trunkOffsetPx: 24
    });

    assert.ok(firstGeometry.trunkX < secondGeometry.trunkX);
    assert.notEqual(firstGeometry.trunkX, secondGeometry.trunkX);
});

test("вторичная ветка не уезжает по горизонтали за пределы навигационной панели", () => {
    const geometry = buildAnchoredConnectionGeometry({
        rootRect: createRect(0, 0, 960, 640),
        anchorRect: createRect(24, 280, 220, 52),
        targetRects: [
            createRect(40, 344, 228, 46),
            createRect(40, 396, 228, 46)
        ],
        side: "right",
        trunkOffsetPx: 54,
        horizontalClampRect: createRect(0, 0, 280, 640)
    });

    assert.equal(geometry.trunkX, 272);
    assert.ok(geometry.trunkX <= 272);
    assert.ok(geometry.targets.every((target) => target.x <= 272));
});

test("после соединения с блоком линия возвращается на ту же вертикаль", () => {
    const geometry = buildTagConnectionGeometry({
        rootRect: createRect(0, 0, 280, 640),
        buttonRect: createRect(138, 20, 102, 28),
        targetRects: [
            createRect(20, 120, 216, 52),
            createRect(34, 178, 202, 46)
        ]
    });

    const path = buildContinuousConnectionPath(geometry);
    const points = parsePathPoints(path);
    const firstReturnPoint = points[4];
    const secondVerticalPoint = points[5];

    assert.match(path, /^M /);
    assert.deepEqual(points[3], geometry.targets[0]);
    assert.equal(firstReturnPoint.y, geometry.targets[0].y);
    assert.equal(secondVerticalPoint.x, firstReturnPoint.x);
    assert.equal(secondVerticalPoint.y, geometry.targets[1].y);
    assert.equal(firstReturnPoint.x, geometry.trunkX);
});

test("все вертикальные сегменты идут по одной координате", () => {
    const geometry = buildTagConnectionGeometry({
        rootRect: createRect(0, 0, 280, 640),
        buttonRect: createRect(138, 20, 102, 28),
        targetRects: [
            createRect(20, 120, 216, 52),
            createRect(34, 178, 202, 46)
        ]
    });

    const path = buildContinuousConnectionPath(geometry);
    const points = parsePathPoints(path);
    const firstReturnPoint = points[1];
    const firstVerticalPoint = points[2];

    assert.deepEqual(points[0], geometry.start);
    assert.equal(firstReturnPoint.x, firstVerticalPoint.x);
    assert.equal(firstReturnPoint.x, geometry.trunkX);
    assert.equal(firstReturnPoint.y, geometry.start.y);
    assert.equal(firstVerticalPoint.y, geometry.targets[0].y);
});

test("не скрывает основную линию, когда блок тега вышел за пределы видимой области", () => {
    const dom = new JSDOM(createOverlayFixture());
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const appRoot = dom.window.document.querySelector("[data-app-root]");
        const layoutRoot = appRoot.querySelector(".lesson-layout");
        const navigationBody = appRoot.querySelector(".lesson-lane__body");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const canvas = appRoot.querySelector("[data-tag-connection-canvas]");
        const tagButton = appRoot.querySelector('[data-tag-legend-control="branching"]');
        const scenarioButton = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');

        navigationLane.dataset.highlightTag = "branching";
        assignRect(layoutRoot, createRect(0, 0, 960, 640));
        assignRect(navigationBody, createRect(0, 60, 280, 180));
        assignRect(mapRoot, createRect(0, 20, 280, 420));
        assignRect(tagButton, createRect(20, 10, 96, 28));
        assignRect(scenarioButton, createRect(24, 140, 220, 52));

        bindNavigationTagConnections({ appRoot });
        redrawNavigationTagConnections(appRoot, { instant: true });
        flushRafQueue();

        const leadPath = canvas.querySelector(".tag-connection-map__path--lead");
        const clipRect = canvas.querySelector("[data-tag-connection-clip-rect]");
        assert.ok(leadPath, "Основная линия должна оставаться на канвасе");
        assert.match(leadPath.getAttribute("d") ?? "", /^M /);
        assert.equal(clipRect?.getAttribute("y"), "60");
        assert.equal(clipRect?.getAttribute("height"), "180");
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("не скрывает вторичную линию, когда дочерний блок вне видимой области", () => {
    const dom = new JSDOM(createOverlayFixture());
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const appRoot = dom.window.document.querySelector("[data-app-root]");
        const layoutRoot = appRoot.querySelector(".lesson-layout");
        const navigationBody = appRoot.querySelector(".lesson-lane__body");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const canvas = appRoot.querySelector("[data-tag-connection-canvas]");
        const tagButton = appRoot.querySelector('[data-tag-legend-control="branching"]');
        const scenarioButton = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const childBlock = appRoot.querySelector("[data-tag-branch-target]");

        navigationLane.dataset.highlightTag = "branching";
        assignRect(layoutRoot, createRect(0, 0, 960, 640));
        assignRect(navigationBody, createRect(0, 40, 280, 180));
        assignRect(mapRoot, createRect(0, 20, 280, 520));
        assignRect(tagButton, createRect(20, 60, 96, 28));
        assignRect(scenarioButton, createRect(24, 140, 220, 52));
        assignRect(childBlock, createRect(40, 320, 204, 46));

        bindNavigationTagConnections({ appRoot });
        redrawNavigationTagConnections(appRoot, { instant: true });
        flushRafQueue();

        const branchPath = canvas.querySelector(".tag-connection-map__path--branch");
        const branchLayer = canvas.querySelector('[data-tag-connection-layer="branch"]');
        const clipRect = canvas.querySelector("[data-tag-connection-clip-rect]");
        assert.ok(branchPath, "Вторичная линия должна оставаться на канвасе");
        assert.match(branchLayer?.getAttribute("clip-path") ?? "", /^url\(#tag-connection-viewport-/);
        assert.equal(clipRect?.getAttribute("y"), "40");
        assert.equal(clipRect?.getAttribute("height"), "180");
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("анимация появления вторичной линии повторяет дорисовку первичной", () => {
    const dom = new JSDOM(createOverlayFixture());
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const appRoot = dom.window.document.querySelector("[data-app-root]");
        const layoutRoot = appRoot.querySelector(".lesson-layout");
        const navigationBody = appRoot.querySelector(".lesson-lane__body");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const canvas = appRoot.querySelector("[data-tag-connection-canvas]");
        const tagButton = appRoot.querySelector('[data-tag-legend-control="branching"]');
        const scenarioButton = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const childBlock = appRoot.querySelector("[data-tag-branch-target]");

        navigationLane.dataset.highlightTag = "branching";
        assignRect(layoutRoot, createRect(0, 0, 960, 640));
        assignRect(navigationBody, createRect(0, 40, 280, 240));
        assignRect(mapRoot, createRect(0, 20, 280, 520));
        assignRect(tagButton, createRect(20, 60, 96, 28));
        assignRect(scenarioButton, createRect(24, 140, 220, 52));
        assignRect(childBlock, createRect(40, 204, 204, 46));

        bindNavigationTagConnections({ appRoot });
        stepRafQueue();

        const animatedBranchPath = canvas.querySelector(".tag-connection-map__path--branch");
        assert.ok(animatedBranchPath, "Ветка должна появиться в DOM сразу после старта анимации");
        const initialPathData = animatedBranchPath.getAttribute("d") ?? "";

        advanceAnimationFrames(12);

        const completedPathData = canvas.querySelector(".tag-connection-map__path--branch")?.getAttribute("d") ?? "";
        assert.notEqual(initialPathData, completedPathData);
        assert.ok(
            initialPathData.length < completedPathData.length,
            "Вторичная линия должна дорисовываться по длине, как первичная"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("закрывает вторичную линию снизу вверх после исчезновения дочернего блока", () => {
    const dom = new JSDOM(createOverlayFixture());
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const appRoot = dom.window.document.querySelector("[data-app-root]");
        const layoutRoot = appRoot.querySelector(".lesson-layout");
        const navigationBody = appRoot.querySelector(".lesson-lane__body");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const canvas = appRoot.querySelector("[data-tag-connection-canvas]");
        const tagButton = appRoot.querySelector('[data-tag-legend-control="branching"]');
        const scenarioButton = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const childBlock = appRoot.querySelector("[data-tag-branch-target]");

        navigationLane.dataset.highlightTag = "branching";
        assignRect(layoutRoot, createRect(0, 0, 960, 640));
        assignRect(navigationBody, createRect(0, 40, 280, 240));
        assignRect(mapRoot, createRect(0, 20, 280, 520));
        assignRect(tagButton, createRect(20, 60, 96, 28));
        assignRect(scenarioButton, createRect(24, 140, 220, 52));
        assignRect(childBlock, createRect(40, 204, 204, 46));

        bindNavigationTagConnections({ appRoot });
        redrawNavigationTagConnections(appRoot, { instant: true });
        flushRafQueue();

        childBlock.remove();
        redrawNavigationTagConnections(appRoot, { preserveAnimation: true });
        stepRafQueue();

        const removingBranchPath = canvas.querySelector(".tag-connection-map__path--branch");
        assert.ok(removingBranchPath?.isConnected, "Ветка не должна удаляться мгновенно");
        const fullPathData = removingBranchPath.getAttribute("d") ?? "";

        advanceAnimationFrames(4);
        const shrinkingPathData = canvas.querySelector(".tag-connection-map__path--branch")?.getAttribute("d") ?? "";
        assert.notEqual(fullPathData, shrinkingPathData);
        assert.ok(
            shrinkingPathData.length < fullPathData.length,
            "Ветка должна укорачиваться от нижнего блока кверху"
        );

        advanceAnimationFrames(20);
        assert.equal(
            canvas.querySelector(".tag-connection-map__path--branch"),
            null,
            "После завершения анимации ветка должна удаляться"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("начинает закрывать вторичную линию сразу при сворачивании панели", () => {
    const dom = new JSDOM(createOverlayFixture());
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const appRoot = dom.window.document.querySelector("[data-app-root]");
        const layoutRoot = appRoot.querySelector(".lesson-layout");
        const navigationBody = appRoot.querySelector(".lesson-lane__body");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const canvas = appRoot.querySelector("[data-tag-connection-canvas]");
        const tagButton = appRoot.querySelector('[data-tag-legend-control="branching"]');
        const scenarioButton = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const childBlock = appRoot.querySelector("[data-tag-branch-target]");
        const subtaskPanel = appRoot.querySelector("[data-scenario-panel]");

        navigationLane.dataset.highlightTag = "branching";
        assignRect(layoutRoot, createRect(0, 0, 960, 640));
        assignRect(navigationBody, createRect(0, 40, 280, 240));
        assignRect(mapRoot, createRect(0, 20, 280, 520));
        assignRect(tagButton, createRect(20, 60, 96, 28));
        assignRect(scenarioButton, createRect(24, 140, 220, 52));
        assignRect(childBlock, createRect(40, 204, 204, 46));
        assignRect(subtaskPanel, createRect(24, 198, 224, 110));

        bindNavigationTagConnections({ appRoot });
        redrawNavigationTagConnections(appRoot, { instant: true });
        flushRafQueue();

        subtaskPanel.dataset.tagConnectionCollapsing = "true";
        redrawNavigationTagConnections(appRoot);
        stepRafQueue();

        const collapsingBranchPath = canvas.querySelector(".tag-connection-map__path--branch");
        assert.ok(collapsingBranchPath?.isConnected, "Ветка должна остаться в DOM во время shrink-анимации");
        const fullPathData = collapsingBranchPath.getAttribute("d") ?? "";

        advanceAnimationFrames(4);
        const shrinkingPathData = canvas.querySelector(".tag-connection-map__path--branch")?.getAttribute("d") ?? "";
        assert.notEqual(fullPathData, shrinkingPathData);
        assert.ok(
            shrinkingPathData.length < fullPathData.length,
            "Shrink-анимация должна стартовать до удаления дочерних блоков из DOM"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

test("не перезапускает анимацию уже открытой вторичной ветки при сдвиге другого блока", () => {
    const dom = new JSDOM(createOverlayFixture());
    const restoreGlobals = installDomGlobals(dom.window);

    try {
        const appRoot = dom.window.document.querySelector("[data-app-root]");
        const layoutRoot = appRoot.querySelector(".lesson-layout");
        const navigationBody = appRoot.querySelector(".lesson-lane__body");
        const mapRoot = appRoot.querySelector("[data-tag-connection-map]");
        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        const canvas = appRoot.querySelector("[data-tag-connection-canvas]");
        const tagButton = appRoot.querySelector('[data-tag-legend-control="branching"]');
        const firstScenarioButton = appRoot.querySelector('[data-scenario-toggle="branch-safety"]');
        const firstChildBlock = appRoot.querySelector("[data-tag-branch-target]");
        const secondFlowNode = createScenarioNode(dom.window.document, {
            slug: "merge-safety",
            label: "Merge safety",
            focusHref: "#/exercise/merge-safety?focus=step-1"
        });

        mapRoot.querySelector(".flow-block-list").append(secondFlowNode);

        const secondScenarioButton = mapRoot.querySelector('[data-scenario-toggle="merge-safety"]');
        const secondChildBlock = secondFlowNode.querySelector("[data-tag-branch-target]");

        navigationLane.dataset.highlightTag = "branching";
        assignRect(layoutRoot, createRect(0, 0, 960, 800));
        assignRect(navigationBody, createRect(0, 40, 280, 320));
        assignRect(mapRoot, createRect(0, 20, 280, 620));
        assignRect(tagButton, createRect(20, 60, 96, 28));
        assignRect(firstScenarioButton, createRect(24, 140, 220, 52));
        assignRect(firstChildBlock, createRect(40, 204, 204, 46));
        assignRect(secondScenarioButton, createRect(24, 300, 220, 52));
        assignRect(secondChildBlock, createRect(40, 364, 204, 46));

        bindNavigationTagConnections({ appRoot });
        redrawNavigationTagConnections(appRoot, { instant: true });
        flushRafQueue();

        const initialSecondBranchPath = canvas.querySelector('[data-branch-key="merge-safety"]');
        const initialPathData = initialSecondBranchPath?.getAttribute("d") ?? "";
        assert.ok(initialSecondBranchPath, "Вторая ветка должна быть изначально видна");

        assignRect(secondScenarioButton, createRect(24, 360, 220, 52));
        assignRect(secondChildBlock, createRect(40, 424, 204, 46));

        redrawNavigationTagConnections(appRoot, { preserveAnimation: true });
        stepRafQueue();

        const movedSecondBranchPath = canvas.querySelector('[data-branch-key="merge-safety"]');
        assert.ok(movedSecondBranchPath, "Ветка второго блока должна остаться в DOM");
        assert.equal(movedSecondBranchPath.__branchAnimation ?? null, null);
        assert.equal(
            movedSecondBranchPath.__branchStateData?.currentVisibleLength,
            movedSecondBranchPath.__branchStateData?.pathLength,
            "Уже открытая ветка должна оставаться полностью видимой после сдвига"
        );
        assert.notEqual(
            movedSecondBranchPath.getAttribute("d") ?? "",
            initialPathData,
            "Ветка второго блока должна сместиться вместе с блоком"
        );
    } finally {
        restoreGlobals();
        dom.window.close();
    }
});

function createRect(left, top, width, height) {
    return {
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height
    };
}

function parsePathPoints(path) {
    return Array.from(path.matchAll(/[ML] (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g), (match) => ({
        x: Number(match[1]),
        y: Number(match[2])
    }));
}

function createOverlayFixture() {
    return `<!doctype html>
        <html>
            <body>
                <div data-app-root>
                    <section class="lesson-layout">
                        <div class="lesson-lane lesson-lane--navigation">
                            <div class="lesson-lane__body">
                                <div class="tag-connection-map" data-tag-connection-map>
                                    <div class="scenario-legend">
                                        <button type="button" data-tag-legend-control="branching">Branching</button>
                                    </div>
                                    <div class="flow-block-list">
                                        <section class="flow-node" data-tags="branching">
                                            <button
                                                type="button"
                                                data-scenario-toggle="branch-safety"
                                                data-tag-connection-target="branching"
                                            >
                                                Branch safety
                                            </button>
                                            <div class="flow-subtask-region" data-scenario-panel="branch-safety">
                                                <a href="#/exercise/branch-safety?focus=step-1" data-tag-branch-target="true">Step 1</a>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <svg data-tag-connection-canvas aria-hidden="true"></svg>
                    </section>
                </div>
            </body>
        </html>`;
}

function createScenarioNode(documentLike, { slug, label, focusHref }) {
    const template = documentLike.createElement("template");
    template.innerHTML = `
        <section class="flow-node" data-tags="branching">
            <button
                type="button"
                data-scenario-toggle="${slug}"
                data-tag-connection-target="branching"
            >
                ${label}
            </button>
            <div class="flow-subtask-region" data-scenario-panel="${slug}">
                <a href="${focusHref}" data-tag-branch-target="true">Step 1</a>
            </div>
        </section>
    `;
    return template.content.firstElementChild;
}

function assignRect(element, rect) {
    Object.defineProperty(element, "getBoundingClientRect", {
        configurable: true,
        value: () => ({
            ...rect,
            x: rect.left,
            y: rect.top,
            toJSON() {
                return this;
            }
        })
    });
}

function installDomGlobals(windowLike) {
    const previousGlobals = new Map();
    const rafQueue = [];
    const timerQueue = [];
    let currentTime = 0;
    let rafId = 0;
    let timerId = 0;
    const bindings = {
        window: windowLike,
        document: windowLike.document,
        Element: windowLike.Element,
        HTMLElement: windowLike.HTMLElement,
        SVGElement: windowLike.SVGElement ?? windowLike.Element,
        SVGPathElement: windowLike.SVGPathElement ?? windowLike.SVGElement ?? windowLike.Element,
        SVGGElement: windowLike.SVGGElement ?? windowLike.SVGElement ?? windowLike.Element,
        performance: {
            now: () => currentTime
        },
        requestAnimationFrame: (callback) => {
            rafId += 1;
            rafQueue.push({ id: rafId, callback });
            return rafId;
        },
        cancelAnimationFrame: (id) => {
            const index = rafQueue.findIndex((entry) => entry.id === id);
            if (index >= 0) {
                rafQueue.splice(index, 1);
            }
        },
        setTimeout: (callback, delay = 0) => {
            timerId += 1;
            timerQueue.push({ id: timerId, callback, delay });
            return timerId;
        },
        clearTimeout: (id) => {
            const index = timerQueue.findIndex((entry) => entry.id === id);
            if (index >= 0) {
                timerQueue.splice(index, 1);
            }
        },
        ResizeObserver: class {
            observe() {}
            disconnect() {}
        }
    };

    Object.defineProperty(windowLike, "performance", {
        configurable: true,
        value: bindings.performance
    });
    windowLike.requestAnimationFrame = bindings.requestAnimationFrame;
    windowLike.cancelAnimationFrame = bindings.cancelAnimationFrame;
    windowLike.setTimeout = bindings.setTimeout;
    windowLike.clearTimeout = bindings.clearTimeout;
    flushRafQueue = () => {
        while (rafQueue.length > 0) {
            const currentFrame = rafQueue.splice(0, rafQueue.length);
            currentFrame.forEach((entry) => {
                entry.callback(currentTime);
            });
        }
    };
    stepRafQueue = (frameMs = 16) => {
        currentTime += frameMs;
        const currentFrame = rafQueue.splice(0, rafQueue.length);
        currentFrame.forEach((entry) => {
            entry.callback(currentTime);
        });
    };
    advanceAnimationFrames = (frameCount, frameMs = 16) => {
        for (let index = 0; index < frameCount; index += 1) {
            if (!rafQueue.length) {
                break;
            }

            stepRafQueue(frameMs);
        }
    };
    flushTimerQueue = () => {
        while (timerQueue.length > 0) {
            const currentTimers = timerQueue.splice(0, timerQueue.length);
            currentTimers.forEach((entry) => {
                entry.callback();
            });
        }
    };

    Object.entries(bindings).forEach(([key, value]) => {
        previousGlobals.set(key, Object.prototype.hasOwnProperty.call(globalThis, key)
            ? globalThis[key]
            : undefined);
        globalThis[key] = value;
    });

    return () => {
        flushRafQueue = () => {};
        stepRafQueue = () => {};
        advanceAnimationFrames = () => {};
        flushTimerQueue = () => {};
        Object.keys(bindings).forEach((key) => {
            const previousValue = previousGlobals.get(key);
            if (typeof previousValue === "undefined") {
                delete globalThis[key];
                return;
            }

            globalThis[key] = previousValue;
        });
    };
}

let flushRafQueue = () => {};
let stepRafQueue = () => {};
let advanceAnimationFrames = () => {};
let flushTimerQueue = () => {};

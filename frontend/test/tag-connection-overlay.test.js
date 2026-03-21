import test from "node:test";
import assert from "node:assert/strict";

import {
    buildContinuousConnectionPath,
    buildTagConnectionGeometry
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
    assert.ok(geometry.targets[0].x > sideReferenceRect.width);
    assert.ok(geometry.trunkX > geometry.start.x);
});

test("после соединения с блоком линия смещается и только потом идет вниз", () => {
    const geometry = buildTagConnectionGeometry({
        rootRect: createRect(0, 0, 280, 640),
        buttonRect: createRect(138, 20, 102, 28),
        targetRects: [
            createRect(20, 120, 216, 52),
            createRect(34, 178, 202, 46)
        ]
    });

    const path = buildContinuousConnectionPath(geometry);
    const expectedStepOut = `H ${geometry.targets[0].x} H `;
    const secondVerticalPrefix = `V ${geometry.targets[1].y}`;

    assert.match(path, /^M /);
    assert.ok(path.includes(expectedStepOut));
    assert.ok(path.includes(secondVerticalPrefix));

    const firstReturnX = extractReturnXAfterFirstTarget(path, geometry.targets[0].x);
    assert.notEqual(firstReturnX, geometry.trunkX);
    assert.ok(firstReturnX < geometry.trunkX);
    assert.ok(firstReturnX > geometry.targets[0].x);
});

test("первая вертикаль совпадает с вертикалью после первого блока", () => {
    const geometry = buildTagConnectionGeometry({
        rootRect: createRect(0, 0, 280, 640),
        buttonRect: createRect(138, 20, 102, 28),
        targetRects: [
            createRect(20, 120, 216, 52),
            createRect(34, 178, 202, 46)
        ]
    });

    const path = buildContinuousConnectionPath(geometry);
    const firstReturnX = extractReturnXAfterFirstTarget(path, geometry.targets[0].x);

    assert.ok(path.startsWith(`M ${geometry.start.x} ${geometry.start.y} H ${firstReturnX} V ${geometry.targets[0].y}`));
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

function extractReturnXAfterFirstTarget(path, targetX) {
    const match = path.match(new RegExp(`H ${targetX} H (\\d+(?:\\.\\d+)?)`));
    return Number(match?.[1]);
}

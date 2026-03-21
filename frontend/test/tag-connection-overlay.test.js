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
    assert.ok(geometry.targets[0].x > geometry.start.x);
    assert.ok(geometry.targets[0].x < geometry.trunkX);
    assert.ok(geometry.trunkX > geometry.start.x);
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

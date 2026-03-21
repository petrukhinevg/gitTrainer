import { escapeSelectorValue } from "./dom-helpers.js";
import { NAVIGATION_TOGGLE_ANIMATION_MS } from "./scroll-animation.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const EDGE_PADDING_PX = 8;
const TARGET_OFFSET_PX = 2;
const TRUNK_OFFSET_PX = 14;
const CONNECTION_FADE_OUT_MS = NAVIGATION_TOGGLE_ANIMATION_MS;
const CONNECTION_DRAW_SPEED_PX_PER_MS = 1.35;
const CONNECTION_MIN_ANIMATION_MS = 32;

export function bindNavigationTagConnections({ appRoot }) {
    const layoutRoot = appRoot.querySelector(".lesson-layout");
    const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
    if (!(layoutRoot instanceof HTMLElement) || !navigationLane) {
        return;
    }

    navigationLane.__tagConnectionCleanup?.();

    const mapRoot = navigationLane.querySelector("[data-tag-connection-map]");
    const navigationBody = navigationLane.querySelector(".lesson-lane__body");
    const canvas = layoutRoot.querySelector("[data-tag-connection-canvas]");
    if (!(mapRoot instanceof HTMLElement) || !isSvgCanvasElement(canvas)) {
        navigationLane.__redrawTagConnections = null;
        navigationLane.__tagConnectionCleanup = null;
        return;
    }

    let rafId = 0;
    let resizeObserver = null;
    let pendingDrawOptions = null;

    const draw = ({ instant = false, preserveAnimation = false } = {}) => {
        rafId = 0;
        pendingDrawOptions = null;
        renderNavigationTagConnections({
            instant,
            preserveAnimation,
            layoutRoot,
            navigationLane,
            mapRoot,
            canvas
        });
    };

    const queueDraw = (options = {}) => {
        pendingDrawOptions = {
            instant: Boolean(options.instant),
            preserveAnimation: Boolean(options.preserveAnimation)
        };

        if (rafId) {
            return;
        }

        rafId = requestAnimationFrame(() => {
            draw(pendingDrawOptions ?? {});
        });
    };

    window.addEventListener("resize", queueDraw);

    navigationLane.__redrawTagConnections = queueDraw;
    navigationLane.__tagConnectionCleanup = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }

        clearCanvasHideTimer(canvas);
        clearCanvasHideFrame(canvas);
        clearCanvasAnimation(canvas);
        clearCanvasAnimationFrame(canvas);
        window.removeEventListener("resize", queueDraw);
        navigationBody?.removeEventListener("scroll", queueDraw);
        resizeObserver?.disconnect();
    };

    if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
            queueDraw();
        });
        resizeObserver.observe(mapRoot);
    }

    navigationBody?.addEventListener("scroll", queueDraw);
    queueDraw();
}

export function redrawNavigationTagConnections(appRoot, options = {}) {
    appRoot.querySelector(".lesson-lane--navigation")?.__redrawTagConnections?.(options);
}

export function buildTagConnectionGeometry({ rootRect, buttonRect, targetRects, sideReferenceRect = rootRect }) {
    if (!rootRect || !buttonRect || !Array.isArray(targetRects) || targetRects.length === 0) {
        return null;
    }

    const width = Math.max(1, Math.ceil(rootRect.width));
    const height = Math.max(1, Math.ceil(rootRect.height));
    const button = toRelativeRect(buttonRect, rootRect);
    const sideReferenceWidth = Math.max(1, Math.ceil(sideReferenceRect.width));
    const buttonInSideReference = toRelativeRect(buttonRect, sideReferenceRect);
    const targets = targetRects
        .map((targetRect) => toRelativeRect(targetRect, rootRect))
        .sort((left, right) => left.centerY - right.centerY);

    if (!targets.length) {
        return null;
    }

    const side = buttonInSideReference.centerX <= sideReferenceWidth / 2 ? "left" : "right";
    const startX = side === "left" ? button.left : button.right;
    const startY = button.centerY;
    const branchTargets = targets.map((target) => ({
        x: side === "left" ? target.left - TARGET_OFFSET_PX : target.right + TARGET_OFFSET_PX,
        y: target.centerY
    }));
    const branchEdgeX = side === "left"
        ? Math.min(startX, ...branchTargets.map((target) => target.x))
        : Math.max(startX, ...branchTargets.map((target) => target.x));
    const trunkX = side === "left"
        ? clampNumber(branchEdgeX - TRUNK_OFFSET_PX, EDGE_PADDING_PX, width - EDGE_PADDING_PX)
        : clampNumber(branchEdgeX + TRUNK_OFFSET_PX, EDGE_PADDING_PX, width - EDGE_PADDING_PX);
    const trunkTop = Math.min(startY, ...branchTargets.map((target) => target.y));
    const trunkBottom = Math.max(startY, ...branchTargets.map((target) => target.y));

    return {
        width,
        height,
        side,
        start: {
            x: clampNumber(startX, EDGE_PADDING_PX, width - EDGE_PADDING_PX),
            y: clampNumber(startY, EDGE_PADDING_PX, height - EDGE_PADDING_PX)
        },
        trunkX,
        trunkTop: clampNumber(trunkTop, EDGE_PADDING_PX, height - EDGE_PADDING_PX),
        trunkBottom: clampNumber(trunkBottom, EDGE_PADDING_PX, height - EDGE_PADDING_PX),
        targets: branchTargets.map((target) => ({
            x: clampNumber(target.x, EDGE_PADDING_PX, width - EDGE_PADDING_PX),
            y: clampNumber(target.y, EDGE_PADDING_PX, height - EDGE_PADDING_PX)
        }))
    };
}

export function buildContinuousConnectionPath(geometry) {
    const polyline = buildContinuousConnectionPolyline(geometry);
    return polyline ? buildPathDataFromPoints(polyline.points) : "";
}

function renderNavigationTagConnections({ instant = false, preserveAnimation = false, layoutRoot, navigationLane, mapRoot, canvas }) {
    const activeTag = normalizeTagToken(navigationLane.dataset.highlightTag);
    if (!activeTag) {
        navigationLane.__tagConnectionState = null;
        hideCanvas(canvas);
        return;
    }

    const button = mapRoot.querySelector(`[data-tag-legend-control="${escapeSelectorValue(activeTag)}"]`);
    const targetElements = Array.from(
        mapRoot.querySelectorAll(`[data-tag-connection-target~="${escapeSelectorValue(activeTag)}"]`)
    ).filter((element) => element instanceof HTMLElement && element.getClientRects().length > 0);

    if (!(button instanceof HTMLElement) || targetElements.length === 0) {
        navigationLane.__tagConnectionState = null;
        hideCanvas(canvas);
        return;
    }

    const geometry = buildTagConnectionGeometry({
        rootRect: layoutRoot.getBoundingClientRect(),
        buttonRect: button.getBoundingClientRect(),
        targetRects: targetElements.map((element) => element.getBoundingClientRect()),
        sideReferenceRect: mapRoot.getBoundingClientRect()
    });

    if (!geometry) {
        navigationLane.__tagConnectionState = null;
        hideCanvas(canvas);
        return;
    }

    const previousState = navigationLane.__tagConnectionState ?? null;
    const accent = resolveAccentColor(button);
    const nextState = createConnectionState(activeTag, geometry);
    const renderState = resolveRenderState({
        canvas,
        instant,
        preserveAnimation,
        previousState,
        nextState
    });
    const visiblePathData = buildPartialPathData(renderState.renderPoints, renderState.visibleLength);
    const startDot = createCircleElement(
        renderState.renderPoints[0].x,
        renderState.renderPoints[0].y,
        accent,
        "tag-connection-map__dot tag-connection-map__dot--visible"
    );
    const targetDots = renderState.renderTargetPoints.map((target, index) => {
        const isVisible = renderState.visibleLength >= renderState.renderTargetRevealLengths[index];
        return createCircleElement(
            target.x,
            target.y,
            accent,
            `tag-connection-map__dot${isVisible ? " tag-connection-map__dot--visible" : ""}`
        );
    });
    const leadPath = createPathElement(
        visiblePathData,
        accent,
        "tag-connection-map__path tag-connection-map__path--lead"
    );

    clearCanvasHideTimer(canvas);
    canvas.setAttribute("viewBox", `0 0 ${geometry.width} ${geometry.height}`);
    canvas.setAttribute("width", String(geometry.width));
    canvas.setAttribute("height", String(geometry.height));
    canvas.replaceChildren(leadPath, startDot, ...targetDots);
    showCanvasSteady(canvas);
    navigationLane.__tagConnectionState = nextState;

    if (renderState.isAnimating) {
        scheduleCanvasAnimationFrame(canvas, navigationLane);
    } else {
        clearCanvasAnimationFrame(canvas);
    }
}

function createConnectionState(activeTag, geometry) {
    const polyline = buildContinuousConnectionPolyline(geometry);
    return {
        activeTag,
        pathData: buildPathDataFromPoints(polyline.points),
        pathLength: polyline.length,
        points: polyline.points,
        targetPoints: polyline.targetPoints,
        targetRevealLengths: polyline.targetRevealLengths
    };
}

function buildContinuousConnectionPolyline(geometry) {
    if (!geometry?.start || !Array.isArray(geometry.targets) || geometry.targets.length === 0) {
        return null;
    }

    const points = [copyPoint(geometry.start)];
    const targetPoints = [];
    const targetRevealLengths = [];
    let pathLength = 0;
    const carryX = geometry.trunkX;

    pathLength += pushPolylinePoint(points, { x: carryX, y: geometry.start.y });

    geometry.targets.forEach((target) => {
        pathLength += pushPolylinePoint(points, { x: carryX, y: target.y });
        pathLength += pushPolylinePoint(points, target);
        targetPoints.push(copyPoint(target));
        targetRevealLengths.push(pathLength);
        pathLength += pushPolylinePoint(points, { x: carryX, y: target.y });
    });

    return {
        points,
        length: pathLength || 1,
        targetPoints,
        targetRevealLengths
    };
}

function pushPolylinePoint(points, point) {
    const lastPoint = points[points.length - 1];
    if (lastPoint && lastPoint.x === point.x && lastPoint.y === point.y) {
        return 0;
    }

    points.push(copyPoint(point));

    if (!lastPoint) {
        return 0;
    }

    return measureSegmentLength(lastPoint, point);
}

function buildPartialPathData(points, visibleLength) {
    if (!Array.isArray(points) || points.length === 0) {
        return "";
    }

    const commands = [`M ${points[0].x} ${points[0].y}`];
    let remainingLength = Math.max(0, visibleLength);

    for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        const segmentLength = measureSegmentLength(start, end);

        if (segmentLength === 0 || remainingLength <= 0) {
            continue;
        }

        if (remainingLength >= segmentLength) {
            appendPathSegment(commands, end);
            remainingLength -= segmentLength;
            continue;
        }

        appendPathSegment(commands, interpolateSegmentPoint(start, end, remainingLength));
        break;
    }

    return commands.join(" ");
}

function buildPathDataFromPoints(points) {
    if (!Array.isArray(points) || points.length === 0) {
        return "";
    }

    const commands = [`M ${points[0].x} ${points[0].y}`];
    points.slice(1).forEach((point) => {
        appendPathSegment(commands, point);
    });
    return commands.join(" ");
}

function appendPathSegment(commands, point) {
    commands.push(`L ${point.x} ${point.y}`);
}

function interpolateSegmentPoint(start, end, visibleLength) {
    const segmentLength = measureSegmentLength(start, end);
    if (segmentLength === 0) {
        return copyPoint(start);
    }

    const ratio = clampNumber(visibleLength / segmentLength, 0, 1);
    return {
        x: snapCoordinate(start.x + ((end.x - start.x) * ratio)),
        y: snapCoordinate(start.y + ((end.y - start.y) * ratio))
    };
}

function measureSegmentLength(start, end) {
    return Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
}

function resolveRenderState({ canvas, instant, preserveAnimation, previousState, nextState }) {
    const now = performance.now();
    const currentVisibleLength = readAnimatedVisibleLength(canvas, previousState?.pathLength ?? 0, now);
    const animationRenderState = readAnimationRenderState(canvas);

    if (instant) {
        clearCanvasAnimation(canvas);
        return {
            visibleLength: nextState.pathLength,
            isAnimating: false,
            renderPoints: nextState.points,
            renderTargetPoints: nextState.targetPoints,
            renderTargetRevealLengths: nextState.targetRevealLengths
        };
    }

    if (!previousState || previousState.activeTag !== nextState.activeTag) {
        return createAnimatedRenderState(canvas, {
            activeTag: nextState.activeTag,
            fromLength: 0,
            toLength: nextState.pathLength,
            renderSourceState: nextState,
            now
        });
    }

    if (previousState.pathData === nextState.pathData) {
        const visibleLength = readAnimatedVisibleLength(canvas, nextState.pathLength, now);
        return {
            visibleLength,
            isAnimating: hasActiveAnimation(canvas),
            renderPoints: animationRenderState?.renderPoints ?? nextState.points,
            renderTargetPoints: animationRenderState?.renderTargetPoints ?? nextState.targetPoints,
            renderTargetRevealLengths: animationRenderState?.renderTargetRevealLengths ?? nextState.targetRevealLengths
        };
    }

    const isShrinking = isPathPrefix(nextState.pathData, previousState.pathData);
    const renderSourceState = isShrinking ? previousState : nextState;

    if (
        preserveAnimation
        || hasActiveAnimation(canvas)
        || isPathPrefix(previousState.pathData, nextState.pathData)
        || isShrinking
    ) {
        return createAnimatedRenderState(canvas, {
            activeTag: nextState.activeTag,
            fromLength: clampNumber(currentVisibleLength, 0, Math.max(previousState.pathLength, nextState.pathLength)),
            toLength: nextState.pathLength,
            renderSourceState,
            now
        });
    }

    clearCanvasAnimation(canvas);
    return {
        visibleLength: nextState.pathLength,
        isAnimating: false,
        renderPoints: nextState.points,
        renderTargetPoints: nextState.targetPoints,
        renderTargetRevealLengths: nextState.targetRevealLengths
    };
}

function createAnimatedRenderState(canvas, { activeTag, fromLength, toLength, renderSourceState, now }) {
    const clampedFromLength = clampNumber(fromLength, 0, Math.max(fromLength, toLength));
    if (Math.abs(toLength - clampedFromLength) < 0.5) {
        clearCanvasAnimation(canvas);
        return {
            visibleLength: toLength,
            isAnimating: false,
            renderPoints: renderSourceState.points,
            renderTargetPoints: renderSourceState.targetPoints,
            renderTargetRevealLengths: renderSourceState.targetRevealLengths
        };
    }

    canvas.__tagConnectionAnimation = {
        activeTag,
        fromLength: clampedFromLength,
        toLength,
        renderPoints: renderSourceState.points,
        renderTargetPoints: renderSourceState.targetPoints,
        renderTargetRevealLengths: renderSourceState.targetRevealLengths,
        startedAt: now,
        duration: resolveAnimationDuration(Math.abs(toLength - clampedFromLength))
    };

    return {
        visibleLength: clampedFromLength,
        isAnimating: true,
        renderPoints: renderSourceState.points,
        renderTargetPoints: renderSourceState.targetPoints,
        renderTargetRevealLengths: renderSourceState.targetRevealLengths
    };
}

function readAnimatedVisibleLength(canvas, fallbackLength, now = performance.now()) {
    const animation = canvas.__tagConnectionAnimation;
    if (!animation) {
        return fallbackLength;
    }

    const elapsed = Math.max(0, now - animation.startedAt);
    const progress = animation.duration <= 0 ? 1 : clampNumber(elapsed / animation.duration, 0, 1);
    const currentLength = animation.fromLength + ((animation.toLength - animation.fromLength) * progress);

    if (progress >= 1) {
        clearCanvasAnimation(canvas);
        return animation.toLength;
    }

    return currentLength;
}

function resolveAnimationDuration(distance) {
    return Math.max(CONNECTION_MIN_ANIMATION_MS, distance / CONNECTION_DRAW_SPEED_PX_PER_MS);
}

function readAnimationRenderState(canvas) {
    const animation = canvas.__tagConnectionAnimation;
    if (!animation) {
        return null;
    }

    return {
        renderPoints: animation.renderPoints,
        renderTargetPoints: animation.renderTargetPoints,
        renderTargetRevealLengths: animation.renderTargetRevealLengths
    };
}

function hasActiveAnimation(canvas) {
    return Boolean(canvas.__tagConnectionAnimation);
}

function scheduleCanvasAnimationFrame(canvas, navigationLane) {
    if (canvas.__tagConnectionAnimationFrame) {
        return;
    }

    canvas.__tagConnectionAnimationFrame = window.requestAnimationFrame(() => {
        canvas.__tagConnectionAnimationFrame = 0;
        navigationLane.__redrawTagConnections?.({ preserveAnimation: true });
    });
}

function clearCanvasAnimationFrame(canvas) {
    if (!canvas.__tagConnectionAnimationFrame) {
        return;
    }

    window.cancelAnimationFrame(canvas.__tagConnectionAnimationFrame);
    canvas.__tagConnectionAnimationFrame = 0;
}

function clearCanvas(canvas) {
    clearCanvasHideTimer(canvas);
    clearCanvasHideFrame(canvas);
    clearCanvasAnimation(canvas);
    clearCanvasAnimationFrame(canvas);
    canvas.removeAttribute("viewBox");
    canvas.classList.remove("tag-connection-map__canvas--visible");
    canvas.classList.remove("tag-connection-map__canvas--instant");
    canvas.classList.remove("tag-connection-map__canvas--steady");
    canvas.replaceChildren();
}

function clearCanvasAnimation(canvas) {
    canvas.__tagConnectionAnimation = null;
}

function resolveAccentColor(element) {
    const accent = window.getComputedStyle(element).getPropertyValue("--tag-accent").trim();
    return accent || "#456d9a";
}

function normalizeTagToken(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

function isSvgCanvasElement(element) {
    return element instanceof Element && element.namespaceURI === SVG_NAMESPACE;
}

function toRelativeRect(rect, rootRect) {
    return {
        left: snapCoordinate(rect.left - rootRect.left),
        right: snapCoordinate(rect.right - rootRect.left),
        top: snapCoordinate(rect.top - rootRect.top),
        bottom: snapCoordinate(rect.bottom - rootRect.top),
        centerX: snapCoordinate((rect.left - rootRect.left) + (rect.width / 2)),
        centerY: snapCoordinate((rect.top - rootRect.top) + (rect.height / 2))
    };
}

function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function createPathElement(pathData, accent, className) {
    const path = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", pathData);
    path.setAttribute("class", className);
    path.style.setProperty("--tag-connection-accent", accent);
    return path;
}

function createCircleElement(x, y, accent, className) {
    const circle = document.createElementNS(SVG_NAMESPACE, "circle");
    circle.setAttribute("cx", String(x));
    circle.setAttribute("cy", String(y));
    circle.setAttribute("r", "2.5");
    circle.setAttribute("class", className);
    circle.style.setProperty("--tag-connection-accent", accent);
    return circle;
}

function hideCanvas(canvas) {
    if (!canvas.childNodes.length) {
        clearCanvas(canvas);
        return;
    }

    clearCanvasHideTimer(canvas);
    clearCanvasHideFrame(canvas);
    clearCanvasAnimation(canvas);
    clearCanvasAnimationFrame(canvas);
    canvas.classList.remove("tag-connection-map__canvas--instant");
    canvas.__tagConnectionHideFrame = window.requestAnimationFrame(() => {
        canvas.__tagConnectionHideFrame = 0;
        canvas.classList.remove("tag-connection-map__canvas--visible");
        canvas.__tagConnectionHideTimer = window.setTimeout(() => {
            clearCanvas(canvas);
        }, CONNECTION_FADE_OUT_MS);
    });
}

function clearCanvasHideTimer(canvas) {
    if (!canvas.__tagConnectionHideTimer) {
        return;
    }

    window.clearTimeout(canvas.__tagConnectionHideTimer);
    canvas.__tagConnectionHideTimer = 0;
}

function clearCanvasHideFrame(canvas) {
    if (!canvas.__tagConnectionHideFrame) {
        return;
    }

    window.cancelAnimationFrame(canvas.__tagConnectionHideFrame);
    canvas.__tagConnectionHideFrame = 0;
}

function showCanvasSteady(canvas) {
    clearCanvasHideTimer(canvas);
    canvas.classList.add("tag-connection-map__canvas--visible");
    canvas.classList.add("tag-connection-map__canvas--instant");
    canvas.classList.add("tag-connection-map__canvas--steady");

    requestAnimationFrame(() => {
        canvas.classList.remove("tag-connection-map__canvas--instant");
    });
}

function isPathPrefix(prefixPath, fullPath) {
    if (!prefixPath || !fullPath) {
        return false;
    }

    return fullPath === prefixPath || fullPath.startsWith(`${prefixPath} `);
}

function snapCoordinate(value) {
    return Math.round(value * 2) / 2;
}

function copyPoint(point) {
    return {
        x: point.x,
        y: point.y
    };
}

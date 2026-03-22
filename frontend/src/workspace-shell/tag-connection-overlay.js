import { escapeSelectorValue } from "./dom-helpers.js";
import { NAVIGATION_TOGGLE_ANIMATION_MS } from "./scroll-animation.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const EDGE_PADDING_PX = 10;
const TARGET_OFFSET_PX = 2;
const TRUNK_OFFSET_PX = 10;
const CONNECTION_FADE_OUT_MS = NAVIGATION_TOGGLE_ANIMATION_MS;
const CONNECTION_DRAW_SPEED_PX_PER_MS = 2;
const CONNECTION_MIN_ANIMATION_MS = 20;
const SECONDARY_BRANCH_SHRINK_DURATION_FACTOR = 0.45;
let nextCanvasClipPathId = 0;
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
            navigationBody,
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

export function buildTagConnectionGeometry({
    rootRect,
    buttonRect,
    targetRects,
    sideReferenceRect = rootRect,
    horizontalClampRect = rootRect,
    preferredTrunkX = null
}) {
    if (!rootRect || !buttonRect || !Array.isArray(targetRects) || targetRects.length === 0) {
        return null;
    }

    const sideReferenceWidth = Math.max(1, Math.ceil(sideReferenceRect.width));
    const buttonInSideReference = toRelativeRect(buttonRect, sideReferenceRect);
    const side = resolveConnectionSide(buttonInSideReference, sideReferenceWidth);
    return buildAnchoredConnectionGeometry({
        rootRect,
        anchorRect: buttonRect,
        targetRects,
        side,
        horizontalClampRect,
        preferredTrunkX
    });
}

export function buildAnchoredConnectionGeometry({
    rootRect,
    anchorRect,
    targetRects,
    side,
    trunkOffsetPx = TRUNK_OFFSET_PX,
    horizontalClampRect = rootRect,
    preferredTrunkX = null
}) {
    if (!rootRect || !anchorRect || !Array.isArray(targetRects) || targetRects.length === 0 || !side) {
        return null;
    }

    const width = Math.max(1, Math.ceil(rootRect.width));
    const height = Math.max(1, Math.ceil(rootRect.height));
    const anchor = toRelativeRect(anchorRect, rootRect);
    const horizontalBounds = resolveHorizontalBounds(rootRect, horizontalClampRect, width);
    const targets = targetRects
        .map((targetRect) => toRelativeRect(targetRect, rootRect))
        .sort((left, right) => left.centerY - right.centerY);

    if (!targets.length) {
        return null;
    }

    const startX = side === "left" ? anchor.left : anchor.right;
    const startY = anchor.centerY;
    const branchTargets = targets.map((target) => ({
        x: side === "left" ? target.left - TARGET_OFFSET_PX : target.right + TARGET_OFFSET_PX,
        y: target.centerY
    }));
    const branchEdgeX = side === "left"
        ? Math.min(startX, ...branchTargets.map((target) => target.x))
        : Math.max(startX, ...branchTargets.map((target) => target.x));
    const fallbackTrunkX = side === "left"
        ? clampNumber(branchEdgeX - trunkOffsetPx, horizontalBounds.minX, horizontalBounds.maxX)
        : clampNumber(branchEdgeX + trunkOffsetPx, horizontalBounds.minX, horizontalBounds.maxX);
    const trunkX = resolvePreferredTrunkX({
        preferredTrunkX,
        fallbackTrunkX,
        branchEdgeX,
        side,
        horizontalBounds
    });
    const trunkTop = Math.min(startY, ...branchTargets.map((target) => target.y));
    const trunkBottom = Math.max(startY, ...branchTargets.map((target) => target.y));

    return {
        width,
        height,
        side,
        start: {
            x: clampNumber(startX, horizontalBounds.minX, horizontalBounds.maxX),
            y: clampNumber(startY, EDGE_PADDING_PX, height - EDGE_PADDING_PX)
        },
        trunkX,
        trunkTop: clampNumber(trunkTop, EDGE_PADDING_PX, height - EDGE_PADDING_PX),
        trunkBottom: clampNumber(trunkBottom, EDGE_PADDING_PX, height - EDGE_PADDING_PX),
        targets: branchTargets.map((target) => ({
            x: clampNumber(target.x, horizontalBounds.minX, horizontalBounds.maxX),
            y: clampNumber(target.y, EDGE_PADDING_PX, height - EDGE_PADDING_PX)
        }))
    };
}

export function buildContinuousConnectionPath(geometry) {
    const polyline = buildContinuousConnectionPolyline(geometry);
    return polyline ? buildPathDataFromPoints(polyline.points) : "";
}

function shouldRenderNavigationConnections(layoutRoot) {
    if (!(layoutRoot instanceof HTMLElement)) {
        return false;
    }

    if (window.matchMedia?.("(max-width: 960px)").matches) {
        return true;
    }

    return (
        !layoutRoot.classList.contains("lesson-layout--navigation-collapsed")
            || layoutRoot.classList.contains("lesson-layout--navigation-collapsing")
    )
        && !layoutRoot.classList.contains("lesson-layout--navigation-transitioning");
}

function renderNavigationTagConnections({
    instant = false,
    preserveAnimation = false,
    layoutRoot,
    navigationLane,
    navigationBody,
    mapRoot,
    canvas
}) {
    if (!shouldRenderNavigationConnections(layoutRoot)) {
        navigationLane.__tagConnectionState = null;
        clearFlowBlockActiveTagState(mapRoot);
        clearFlowSubtaskActiveTagState(mapRoot);
        clearSecondaryBranchSideState(mapRoot);
        hideCanvas(canvas);
        return;
    }

    const activeTag = normalizeTagToken(navigationLane.dataset.highlightTag);
    const pinnedTag = normalizeTagToken(navigationLane.dataset.pinnedTag);
    if (!activeTag) {
        navigationLane.__tagConnectionState = null;
        clearFlowBlockActiveTagState(mapRoot);
        clearFlowSubtaskActiveTagState(mapRoot);
        clearSecondaryBranchSideState(mapRoot);
        hideCanvas(canvas);
        return;
    }

    const previousState = navigationLane.__tagConnectionState ?? null;
    const previousBranchStateByKey = createBranchStateMap(previousState?.secondaryBranches ?? []);

    const button = mapRoot.querySelector(`[data-tag-legend-control="${escapeSelectorValue(activeTag)}"]`);
    const targetEntries = Array.from(
        mapRoot.querySelectorAll(`[data-tag-connection-target~="${escapeSelectorValue(activeTag)}"]`)
    )
        .map((element) => ({
            element,
            rect: getRenderableElementRect(element)
        }))
        .filter((entry) => entry.rect)
        .sort((left, right) => left.rect.top - right.rect.top);
    const buttonRect = getRenderableElementRect(button);

    if (!buttonRect || targetEntries.length === 0) {
        navigationLane.__tagConnectionState = null;
        clearFlowBlockActiveTagState(mapRoot);
        clearFlowSubtaskActiveTagState(mapRoot);
        clearSecondaryBranchSideState(mapRoot);
        hideCanvas(canvas);
        return;
    }

    const geometry = buildTagConnectionGeometry({
        rootRect: layoutRoot.getBoundingClientRect(),
        buttonRect,
        targetRects: targetEntries.map((entry) => entry.rect),
        sideReferenceRect: mapRoot.getBoundingClientRect(),
        horizontalClampRect: navigationBody?.getBoundingClientRect() ?? mapRoot.getBoundingClientRect(),
        preferredTrunkX: previousState?.activeTag === activeTag ? previousState.trunkX : null
    });

    if (!geometry) {
        navigationLane.__tagConnectionState = null;
        clearFlowBlockActiveTagState(mapRoot);
        clearFlowSubtaskActiveTagState(mapRoot);
        clearSecondaryBranchSideState(mapRoot);
        hideCanvas(canvas);
        return;
    }

    const accent = resolveAccentColor(button);
    const nextState = createConnectionState(
        activeTag,
        geometry,
        targetEntries.map((entry, index) => resolveTargetKey(entry.element, index))
    );
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
    const secondarySide = nextState.side === "left" ? "right" : "left";
    syncFlowSubtaskLayoutStateBeforeMeasure({
        mapRoot,
        activeTag,
        pinnedTag,
        secondarySide
    });
    const nextBranchStates = buildSecondaryBranchStates({
        activeTag,
        layoutRoot,
        navigationBody,
        mapRoot,
        secondarySide,
        revealLengthByKey: createRevealLengthMap(nextState),
        previousBranchStateByKey
    });
    const { mainLayer, branchLayer, clipRect } = ensureCanvasLayers(canvas);
    syncCanvasViewportClip({
        canvas,
        clipRect,
        mainLayer,
        branchLayer,
        viewportRect: resolveViewportClipRect(
            layoutRoot.getBoundingClientRect(),
            navigationBody?.getBoundingClientRect() ?? mapRoot.getBoundingClientRect()
        )
    });

    clearCanvasHideTimer(canvas);
    canvas.setAttribute("viewBox", `0 0 ${geometry.width} ${geometry.height}`);
    canvas.setAttribute("width", String(geometry.width));
    canvas.setAttribute("height", String(geometry.height));
    mainLayer.replaceChildren(leadPath, startDot, ...targetDots);
    const branchPathByKey = syncSecondaryBranchLayer({
        branchLayer,
        accent,
        visibleLength: renderState.visibleLength,
        nextBranchStates,
        instant
    });
    syncFlowBlockActiveTagState({
        mapRoot,
        activeTag,
        targetEntries,
        targetRevealLengths: nextState.targetRevealLengths,
        visibleLength: renderState.visibleLength,
        branchPathByKey,
        nextBranchStates
    });
    if (pinnedTag === activeTag) {
        mapRoot.dataset.secondaryBranchSide = secondarySide;
    } else {
        clearSecondaryBranchSideState(mapRoot);
    }
    showCanvasSteady(canvas);
    nextState.secondaryBranches = nextBranchStates;
    navigationLane.__tagConnectionState = nextState;

    if (renderState.isAnimating || hasActiveBranchAnimation(branchLayer)) {
        scheduleCanvasAnimationFrame(canvas, navigationLane);
    } else {
        clearCanvasAnimationFrame(canvas);
    }
}

function createConnectionState(activeTag, geometry, targetKeys = []) {
    const polyline = buildContinuousConnectionPolyline(geometry);
    return {
        activeTag,
        side: geometry.side,
        trunkX: geometry.trunkX,
        secondaryBranches: [],
        targetKeys,
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

function resolveSecondaryBranchAnimationDuration(distance, { isShrinking = false } = {}) {
    const baseDuration = resolveAnimationDuration(distance);
    if (!isShrinking) {
        return baseDuration;
    }

    return Math.max(CONNECTION_MIN_ANIMATION_MS, baseDuration * SECONDARY_BRANCH_SHRINK_DURATION_FACTOR);
}

function buildSecondaryBranchStates({
    activeTag,
    layoutRoot,
    navigationBody,
    mapRoot,
    secondarySide,
    revealLengthByKey,
    previousBranchStateByKey
}) {
    const flowNodes = Array.from(
        mapRoot.querySelectorAll(`.flow-node[data-tags~="${escapeSelectorValue(activeTag)}"]`)
    ).filter((node) => node instanceof HTMLElement);

    return flowNodes.flatMap((node, index) => {
        const subtaskPanel = node.querySelector("[data-scenario-panel]");
        if (subtaskPanel instanceof HTMLElement && subtaskPanel.dataset.tagConnectionCollapsing === "true") {
            return [];
        }

        const parentBlock = node.querySelector("[data-scenario-toggle]");
        const branchKey = resolveTargetKey(parentBlock, index);
        const parentRect = getRenderableElementRect(parentBlock);
        const childBlocks = Array.from(node.querySelectorAll("[data-tag-branch-target]"))
            .map((element) => ({
                element,
                rect: getRenderableElementRect(element)
            }))
            .filter((entry) => entry.rect);

        if (
            !parentRect
            || childBlocks.length === 0
        ) {
            return [];
        }

        const geometry = buildAnchoredConnectionGeometry({
            rootRect: layoutRoot.getBoundingClientRect(),
            anchorRect: parentRect,
            targetRects: childBlocks.map((entry) => entry.rect),
            side: secondarySide,
            trunkOffsetPx: resolveSecondaryBranchTrunkOffset(index),
            horizontalClampRect: navigationBody?.getBoundingClientRect() ?? mapRoot.getBoundingClientRect(),
            preferredTrunkX: previousBranchStateByKey.get(branchKey)?.activeTag === activeTag
                ? previousBranchStateByKey.get(branchKey)?.trunkX
                : null
        });

        if (!geometry) {
            return [];
        }

        const polyline = buildContinuousConnectionPolyline(geometry);
        if (!polyline) {
            return [];
        }

        return [
            {
                key: branchKey,
                activeTag,
                trunkX: geometry.trunkX,
                pathData: buildPathDataFromPoints(polyline.points),
                pathLength: polyline.length,
                points: polyline.points,
                revealLength: revealLengthByKey.get(branchKey) ?? 0,
                targetElements: childBlocks.map((entry) => entry.element),
                targetRevealLengths: polyline.targetRevealLengths
            }
        ];
    });
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

function createRevealLengthMap(connectionState) {
    const revealLengthByKey = new Map();
    connectionState.targetKeys.forEach((key, index) => {
        if (!key) {
            return;
        }

        revealLengthByKey.set(key, connectionState.targetRevealLengths[index] ?? 0);
    });
    return revealLengthByKey;
}

function createBranchStateMap(branchStates) {
    const branchStateByKey = new Map();

    branchStates.forEach((branchState) => {
        if (!branchState?.key) {
            return;
        }

        branchStateByKey.set(branchState.key, branchState);
    });

    return branchStateByKey;
}

function ensureCanvasLayers(canvas) {
    let defs = canvas.querySelector('[data-tag-connection-layer="defs"]');
    let mainLayer = canvas.querySelector('[data-tag-connection-layer="main"]');
    let branchLayer = canvas.querySelector('[data-tag-connection-layer="branch"]');
    let clipRect = canvas.querySelector("[data-tag-connection-clip-rect]");

    if (!isSvgTagName(defs, "defs")) {
        defs = document.createElementNS(SVG_NAMESPACE, "defs");
        defs.setAttribute("data-tag-connection-layer", "defs");
    }

    if (!(mainLayer instanceof SVGGElement)) {
        mainLayer = document.createElementNS(SVG_NAMESPACE, "g");
        mainLayer.setAttribute("data-tag-connection-layer", "main");
    }

    if (!(branchLayer instanceof SVGGElement)) {
        branchLayer = document.createElementNS(SVG_NAMESPACE, "g");
        branchLayer.setAttribute("data-tag-connection-layer", "branch");
    }

    if (!isSvgTagName(clipRect, "rect")) {
        clipRect = document.createElementNS(SVG_NAMESPACE, "rect");
        clipRect.setAttribute("data-tag-connection-clip-rect", "true");
    }

    const clipPath = ensureCanvasClipPath(canvas, defs, clipRect);

    if (
        canvas.firstElementChild !== defs
        || defs.nextElementSibling !== mainLayer
        || canvas.lastElementChild !== branchLayer
    ) {
        canvas.replaceChildren(defs, mainLayer, branchLayer);
    }

    return {
        defs,
        mainLayer,
        branchLayer,
        clipPath,
        clipRect
    };
}

function syncSecondaryBranchLayer({ branchLayer, accent, visibleLength, nextBranchStates, instant = false }) {
    const nextBranchKeySet = new Set(nextBranchStates.map((branch) => branch.key));
    const existingPaths = Array.from(branchLayer.querySelectorAll("[data-branch-key]"))
        .filter((element) => element instanceof SVGPathElement);

    existingPaths.forEach((path) => {
        const branchKey = path.dataset.branchKey;
        if (!branchKey || nextBranchKeySet.has(branchKey)) {
            return;
        }

        if (path.dataset.branchRemoving === "true") {
            return;
        }

        const previousState = path.__branchStateData;
        if (!previousState) {
            path.remove();
            return;
        }

        const renderState = resolveBranchRenderState({
            path,
            nextState: previousState,
            targetVisibleLength: 0,
            instant
        });
        if (renderState.shouldRemove) {
            clearBranchAnimation(path);
            path.remove();
            return;
        }

        applyBranchRenderState(path, accent, renderState);
    });

    const branchPathByKey = new Map();
    nextBranchStates.forEach((branch) => {
        let path = branchLayer.querySelector(`[data-branch-key="${escapeSelectorValue(branch.key)}"]`);
        if (!(path instanceof SVGPathElement)) {
            path = createPathElement(
                "",
                accent,
                "tag-connection-map__path tag-connection-map__path--branch"
            );
            path.dataset.branchKey = branch.key;
            branchLayer.append(path);
        }

        const previousState = path.__branchStateData ?? null;
        const shouldKeepVisible = previousState?.activeTag === branch.activeTag
            && isBranchFullyVisible(previousState);

        const renderState = resolveBranchRenderState({
            path,
            nextState: branch,
            targetVisibleLength: shouldKeepVisible || visibleLength >= branch.revealLength ? branch.pathLength : 0,
            instant
        });
        applyBranchRenderState(path, accent, renderState);
        branchPathByKey.set(branch.key, path);
    });

    return branchPathByKey;
}

function syncFlowBlockActiveTagState({
    mapRoot,
    activeTag,
    targetEntries,
    targetRevealLengths,
    visibleLength,
    branchPathByKey,
    nextBranchStates
}) {
    clearFlowBlockActiveTagState(mapRoot);

    if (!(mapRoot instanceof HTMLElement) || !activeTag) {
        clearFlowSubtaskActiveTagState(mapRoot);
        return;
    }

    syncFlowSubtaskActiveTagState(mapRoot, activeTag, nextBranchStates);

    targetEntries.forEach((entry, index) => {
        if (!(entry.element instanceof HTMLElement)) {
            return;
        }

        if ((targetRevealLengths[index] ?? Number.POSITIVE_INFINITY) <= visibleLength + 0.5) {
            entry.element.dataset.flowBlockActiveTag = activeTag;
        }
    });

    nextBranchStates.forEach((branch) => {
        const path = branchPathByKey.get(branch.key);
        const currentVisibleLength = path?.__branchStateData?.currentVisibleLength ?? 0;

        branch.targetElements?.forEach((element, index) => {
            if (!(element instanceof HTMLElement)) {
                return;
            }

            if ((branch.targetRevealLengths?.[index] ?? Number.POSITIVE_INFINITY) <= currentVisibleLength + 0.5) {
                element.dataset.flowBlockActiveTag = activeTag;
            }
        });
    });
}

function resolveBranchRenderState({ path, nextState, targetVisibleLength, instant = false }) {
    const now = performance.now();
    const previousState = path.__branchStateData ?? null;
    const shouldResetForTagSwitch = previousState?.activeTag !== nextState.activeTag;
    const fallbackLength = previousState?.currentVisibleLength ?? previousState?.pathLength ?? 0;
    const currentVisibleLength = readBranchAnimatedVisibleLength(path, fallbackLength, now);
    const nextVisibleLength = clampNumber(targetVisibleLength, 0, nextState.pathLength);
    const wasFullyVisible = !shouldResetForTagSwitch && isBranchFullyVisible(previousState);

    if (instant) {
        clearBranchAnimation(path);
        return finalizeBranchRenderState(nextState, nextVisibleLength, false);
    }

    if (!previousState || shouldResetForTagSwitch) {
        if (nextVisibleLength <= 0.5) {
            return finalizeBranchRenderState(nextState, 0, false, { shouldRemove: true });
        }

        return createBranchAnimatedRenderState(path, {
            nextState,
            fromLength: 0,
            toLength: nextVisibleLength,
            now
        });
    }

    if (wasFullyVisible && nextVisibleLength > 0.5) {
        clearBranchAnimation(path);
        return finalizeBranchRenderState(nextState, nextVisibleLength, false);
    }

    if (previousState.pathData === nextState.pathData && Math.abs(nextVisibleLength - currentVisibleLength) < 0.5) {
        clearBranchAnimation(path);
        return finalizeBranchRenderState(nextState, nextVisibleLength, false, {
            shouldRemove: nextVisibleLength <= 0.5
        });
    }

    return createBranchAnimatedRenderState(path, {
        nextState,
        fromLength: clampNumber(currentVisibleLength, 0, Math.max(previousState.pathLength, nextState.pathLength)),
        toLength: nextVisibleLength,
        now
    });
}

function createBranchAnimatedRenderState(path, { nextState, fromLength, toLength, now }) {
    const clampedFromLength = clampNumber(fromLength, 0, Math.max(fromLength, toLength));
    if (Math.abs(toLength - clampedFromLength) < 0.5) {
        clearBranchAnimation(path);
        return finalizeBranchRenderState(nextState, toLength, false, {
            shouldRemove: toLength <= 0.5
        });
    }

    path.__branchAnimation = {
        fromLength: clampedFromLength,
        toLength,
        points: nextState.points,
        pathLength: nextState.pathLength,
        startedAt: now,
        duration: resolveSecondaryBranchAnimationDuration(Math.abs(toLength - clampedFromLength), {
            isShrinking: toLength < clampedFromLength
        })
    };

    return finalizeBranchRenderState(nextState, clampedFromLength, true);
}

function finalizeBranchRenderState(nextState, visibleLength, isAnimating, options = {}) {
    return {
        nextState,
        visibleLength,
        isAnimating,
        shouldRemove: options.shouldRemove ?? false
    };
}

function applyBranchRenderState(path, accent, renderState) {
    path.style.setProperty("--tag-connection-accent", accent);
    path.setAttribute("d", buildPartialPathData(renderState.nextState.points, renderState.visibleLength));
    path.__branchStateData = {
        ...renderState.nextState,
        currentVisibleLength: renderState.visibleLength
    };
}

function readBranchAnimatedVisibleLength(path, fallbackLength, now = performance.now()) {
    const animation = path.__branchAnimation;
    if (!animation) {
        return fallbackLength;
    }

    const elapsed = Math.max(0, now - animation.startedAt);
    const progress = animation.duration <= 0 ? 1 : clampNumber(elapsed / animation.duration, 0, 1);
    const currentLength = animation.fromLength + ((animation.toLength - animation.fromLength) * progress);

    if (progress >= 1) {
        clearBranchAnimation(path);
        return animation.toLength;
    }

    return currentLength;
}

function clearBranchAnimation(path) {
    path.__branchAnimation = null;
}

function isBranchFullyVisible(branchState) {
    if (!branchState) {
        return false;
    }

    return Math.abs((branchState.currentVisibleLength ?? 0) - branchState.pathLength) < 0.5;
}

function hasActiveBranchAnimation(branchLayer) {
    return Array.from(branchLayer.querySelectorAll("[data-branch-key]"))
        .some((element) => element instanceof SVGPathElement && element.__branchAnimation);
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

function clearFlowBlockActiveTagState(mapRoot) {
    if (!(mapRoot instanceof HTMLElement)) {
        return;
    }

    mapRoot.querySelectorAll("[data-flow-block-active-tag]").forEach((element) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }

        delete element.dataset.flowBlockActiveTag;
    });
}

function syncFlowSubtaskActiveTagState(mapRoot, activeTag, nextBranchStates) {
    if (!(mapRoot instanceof HTMLElement) || !activeTag) {
        clearFlowSubtaskActiveTagState(mapRoot);
        return;
    }

    const nextGroups = new Set();

    nextBranchStates.forEach((branch) => {
        branch.targetElements?.forEach((element) => {
            if (!(element instanceof HTMLElement)) {
                return;
            }

            const subtaskGroup = element.closest(".flow-subtask-group");
            if (subtaskGroup instanceof HTMLElement) {
                nextGroups.add(subtaskGroup);
            }
        });
    });

    mapRoot.querySelectorAll("[data-flow-subtask-active-tag]").forEach((element) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }

        if (isCollapsingSubtaskGroup(element)) {
            return;
        }

        if (!nextGroups.has(element) || element.dataset.flowSubtaskActiveTag !== activeTag) {
            delete element.dataset.flowSubtaskActiveTag;
        }
    });

    nextGroups.forEach((element) => {
        if (element.dataset.flowSubtaskActiveTag !== activeTag) {
            element.dataset.flowSubtaskActiveTag = activeTag;
        }
    });
}

function syncFlowSubtaskLayoutStateBeforeMeasure({
    mapRoot,
    activeTag,
    pinnedTag,
    secondarySide
}) {
    if (!(mapRoot instanceof HTMLElement) || !activeTag) {
        clearFlowSubtaskActiveTagState(mapRoot);
        clearSecondaryBranchSideState(mapRoot);
        return;
    }

    const shouldShiftSubtasks = pinnedTag === activeTag;
    if (shouldShiftSubtasks) {
        mapRoot.dataset.secondaryBranchSide = secondarySide;
    } else {
        clearSecondaryBranchSideState(mapRoot);
    }

    const nextGroups = shouldShiftSubtasks
        ? collectSubtaskGroupsForActiveTag(mapRoot, activeTag)
        : new Set();

    mapRoot.querySelectorAll("[data-flow-subtask-active-tag]").forEach((element) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }

        if (isCollapsingSubtaskGroup(element)) {
            return;
        }

        if (!nextGroups.has(element) || element.dataset.flowSubtaskActiveTag !== activeTag) {
            delete element.dataset.flowSubtaskActiveTag;
        }
    });

    nextGroups.forEach((element) => {
        if (element.dataset.flowSubtaskActiveTag !== activeTag) {
            element.dataset.flowSubtaskActiveTag = activeTag;
        }
    });
}

function collectSubtaskGroupsForActiveTag(mapRoot, activeTag) {
    const groups = new Set();

    Array.from(
        mapRoot.querySelectorAll(`.flow-node[data-tags~="${escapeSelectorValue(activeTag)}"]`)
    ).forEach((node) => {
        if (!(node instanceof HTMLElement)) {
            return;
        }

        const subtaskPanel = node.querySelector("[data-scenario-panel]");
        if (subtaskPanel instanceof HTMLElement && subtaskPanel.dataset.tagConnectionCollapsing === "true") {
            return;
        }

        const group = node.querySelector(".flow-subtask-group");
        if (group instanceof HTMLElement) {
            groups.add(group);
        }
    });

    return groups;
}

function isCollapsingSubtaskGroup(element) {
    if (!(element instanceof HTMLElement)) {
        return false;
    }

    const subtaskPanel = element.closest("[data-scenario-panel]");
    return subtaskPanel instanceof HTMLElement && subtaskPanel.dataset.tagConnectionCollapsing === "true";
}

function clearFlowSubtaskActiveTagState(mapRoot) {
    if (!(mapRoot instanceof HTMLElement)) {
        return;
    }

    mapRoot.querySelectorAll("[data-flow-subtask-active-tag]").forEach((element) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }

        delete element.dataset.flowSubtaskActiveTag;
    });
}

function clearSecondaryBranchSideState(mapRoot) {
    if (!(mapRoot instanceof HTMLElement)) {
        return;
    }

    delete mapRoot.dataset.secondaryBranchSide;
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

function isSvgTagName(element, tagName) {
    return element instanceof Element
        && element.namespaceURI === SVG_NAMESPACE
        && element.localName === tagName;
}

function getRenderableElementRect(element) {
    if (!(element instanceof HTMLElement)) {
        return null;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
        return null;
    }

    return rect;
}

function resolveConnectionSide(anchorRect, sideReferenceWidth) {
    if (!anchorRect || !Number.isFinite(sideReferenceWidth)) {
        return "left";
    }

    return anchorRect.centerX < sideReferenceWidth / 2 ? "left" : "right";
}

function resolveHorizontalBounds(rootRect, horizontalClampRect, width) {
    if (!horizontalClampRect) {
        return {
            minX: EDGE_PADDING_PX,
            maxX: width - EDGE_PADDING_PX
        };
    }

    const clampLeft = clampNumber(
        snapCoordinate(horizontalClampRect.left - rootRect.left) + EDGE_PADDING_PX,
        EDGE_PADDING_PX,
        width - EDGE_PADDING_PX
    );
    const clampRight = clampNumber(
        snapCoordinate(horizontalClampRect.right - rootRect.left) - EDGE_PADDING_PX,
        EDGE_PADDING_PX,
        width - EDGE_PADDING_PX
    );

    if (clampLeft > clampRight) {
        return {
            minX: EDGE_PADDING_PX,
            maxX: width - EDGE_PADDING_PX
        };
    }

    return {
        minX: clampLeft,
        maxX: clampRight
    };
}

function resolveSecondaryBranchTrunkOffset(index) {
    return TRUNK_OFFSET_PX;
}

function resolveTargetKey(element, index = 0) {
    if (element instanceof HTMLElement && element.dataset.scenarioToggle) {
        return element.dataset.scenarioToggle;
    }

    return `target-${index}`;
}

function resolvePreferredTrunkX({
    preferredTrunkX,
    fallbackTrunkX,
    branchEdgeX,
    side,
    horizontalBounds
}) {
    if (!Number.isFinite(preferredTrunkX)) {
        return fallbackTrunkX;
    }

    const clampedPreferredTrunkX = clampNumber(preferredTrunkX, horizontalBounds.minX, horizontalBounds.maxX);
    const isValidPreferredTrunkX = side === "left"
        ? clampedPreferredTrunkX <= branchEdgeX
        : clampedPreferredTrunkX >= branchEdgeX;

    return isValidPreferredTrunkX ? clampedPreferredTrunkX : fallbackTrunkX;
}

function ensureCanvasClipPath(canvas, defs, clipRect) {
    let clipPath = defs.querySelector("[data-tag-connection-clip-path]");
    if (!isSvgTagName(clipPath, "clipPath")) {
        clipPath = document.createElementNS(SVG_NAMESPACE, "clipPath");
        clipPath.setAttribute("data-tag-connection-clip-path", "true");
    }

    const clipPathId = resolveCanvasClipPathId(canvas);
    clipPath.setAttribute("id", clipPathId);

    if (clipPath.firstElementChild !== clipRect || clipPath.childElementCount !== 1) {
        clipPath.replaceChildren(clipRect);
    }

    if (defs.firstElementChild !== clipPath || defs.childElementCount !== 1) {
        defs.replaceChildren(clipPath);
    }

    return clipPath;
}

function syncCanvasViewportClip({ canvas, clipRect, mainLayer, branchLayer, viewportRect }) {
    clipRect.setAttribute("x", String(viewportRect.x));
    clipRect.setAttribute("y", String(viewportRect.y));
    clipRect.setAttribute("width", String(viewportRect.width));
    clipRect.setAttribute("height", String(viewportRect.height));

    const clipPathValue = `url(#${resolveCanvasClipPathId(canvas)})`;
    mainLayer.setAttribute("clip-path", clipPathValue);
    branchLayer.setAttribute("clip-path", clipPathValue);
}

function resolveCanvasClipPathId(canvas) {
    if (!canvas.__tagConnectionClipPathId) {
        nextCanvasClipPathId += 1;
        canvas.__tagConnectionClipPathId = `tag-connection-viewport-${nextCanvasClipPathId}`;
    }

    return canvas.__tagConnectionClipPathId;
}

function resolveViewportClipRect(rootRect, viewportRect) {
    const left = clampNumber(viewportRect.left - rootRect.left, 0, rootRect.width);
    const top = clampNumber(viewportRect.top - rootRect.top, 0, rootRect.height);
    const right = clampNumber(viewportRect.right - rootRect.left, 0, rootRect.width);
    const bottom = clampNumber(viewportRect.bottom - rootRect.top, 0, rootRect.height);

    return {
        x: snapCoordinate(left),
        y: snapCoordinate(top),
        width: Math.max(1, snapCoordinate(right - left)),
        height: Math.max(1, snapCoordinate(bottom - top))
    };
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
    resetBranchLayerAnimationState(canvas);
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

function resetBranchLayerAnimationState(canvas) {
    canvas.querySelectorAll("[data-branch-key]").forEach((element) => {
        if (!(element instanceof SVGPathElement)) {
            return;
        }

        clearBranchAnimation(element);
        element.__branchStateData = null;
    });
}

function showCanvasSteady(canvas) {
    clearCanvasHideTimer(canvas);
    const wasVisible = canvas.classList.contains("tag-connection-map__canvas--visible");
    canvas.classList.add("tag-connection-map__canvas--visible");
    canvas.classList.add("tag-connection-map__canvas--steady");

    if (!wasVisible) {
        canvas.classList.add("tag-connection-map__canvas--instant");
        requestAnimationFrame(() => {
            canvas.classList.remove("tag-connection-map__canvas--instant");
        });
    }
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

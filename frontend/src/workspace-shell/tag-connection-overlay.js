import { escapeSelectorValue } from "./dom-helpers.js";
import { NAVIGATION_TOGGLE_ANIMATION_MS } from "./scroll-animation.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const EDGE_PADDING_PX = 8;
const TARGET_OFFSET_PX = 8;
const TRUNK_OFFSET_PX = 14;
const TARGET_RETURN_GAP_PX = 12;
const CONNECTION_FADE_OUT_MS = NAVIGATION_TOGGLE_ANIMATION_MS;
const CONNECTION_EXTEND_MS = NAVIGATION_TOGGLE_ANIMATION_MS;
const CONNECTION_TRIM_MS = Math.round(NAVIGATION_TOGGLE_ANIMATION_MS * 0.75);

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
    const draw = ({ instant = false } = {}) => {
        rafId = 0;
        renderNavigationTagConnections({
            instant,
            layoutRoot,
            navigationLane,
            mapRoot,
            canvas
        });
    };
    const queueDraw = ({ instant = false } = {}) => {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
            draw({ instant });
        });
    };
    window.addEventListener("resize", queueDraw);

    navigationLane.__redrawTagConnections = queueDraw;
    navigationLane.__tagConnectionCleanup = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }

        clearCanvasHideTimer(canvas);
        clearCanvasMorphTimer(canvas);
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

export function redrawNavigationTagConnections(appRoot, { instant = false } = {}) {
    appRoot.querySelector(".lesson-lane--navigation")?.__redrawTagConnections?.({ instant });
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
    if (!geometry?.start || !Array.isArray(geometry.targets) || geometry.targets.length === 0) {
        return "";
    }

    let carryX = resolveCarryX({
        side: geometry.side,
        currentCarryX: geometry.trunkX,
        targetX: geometry.targets[0].x
    });
    const segments = [`M ${geometry.start.x} ${geometry.start.y}`, `H ${carryX}`];

    geometry.targets.forEach((target, index) => {
        const nextCarryX = resolveCarryX({
            side: geometry.side,
            currentCarryX: carryX,
            targetX: target.x
        });

        segments.push(`V ${target.y}`);
        segments.push(`H ${target.x}`);
        segments.push(`H ${index === 0 ? carryX : nextCarryX}`);
        carryX = index === 0 ? carryX : nextCarryX;
    });

    return segments.join(" ");
}

function renderNavigationTagConnections({ instant = false, layoutRoot, navigationLane, mapRoot, canvas }) {
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
    const nextPathData = buildContinuousConnectionPath(geometry);
    const nextState = {
        activeTag,
        pathData: nextPathData,
        pathLength: measurePathLength(nextPathData)
    };
    const renderMode = instant ? "instant" : resolveRenderMode(previousState, nextState);
    const displayPathData = renderMode === "trim" && previousState
        ? previousState.pathData
        : nextState.pathData;
    const leadPath = createPathElement(
        displayPathData,
        accent,
        "tag-connection-map__path tag-connection-map__path--lead"
    );
    setPathAnimationMetrics(leadPath, renderMode === "trim" && previousState
        ? previousState.pathLength
        : nextState.pathLength);

    clearCanvasHideTimer(canvas);
    canvas.setAttribute("viewBox", `0 0 ${geometry.width} ${geometry.height}`);
    canvas.setAttribute("width", String(geometry.width));
    canvas.setAttribute("height", String(geometry.height));
    canvas.replaceChildren(
        leadPath,
        createCircleElement(geometry.start.x, geometry.start.y, accent, "tag-connection-map__dot"),
        ...geometry.targets.map((target) => (
            createCircleElement(target.x, target.y, accent, "tag-connection-map__dot")
        ))
    );
    renderConnection(canvas, leadPath, renderMode, previousState, nextState);
    navigationLane.__tagConnectionState = nextState;
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

function clearCanvas(canvas) {
    clearCanvasHideTimer(canvas);
    clearCanvasMorphTimer(canvas);
    canvas.removeAttribute("viewBox");
    canvas.classList.remove("tag-connection-map__canvas--visible");
    canvas.classList.remove("tag-connection-map__canvas--instant");
    canvas.classList.remove("tag-connection-map__canvas--steady");
    canvas.replaceChildren();
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

function resolveCarryX({ side, currentCarryX, targetX }) {
    if (side === "left") {
        return Math.min(targetX - TARGET_RETURN_GAP_PX, currentCarryX + TARGET_RETURN_GAP_PX);
    }

    return Math.max(targetX + TARGET_RETURN_GAP_PX, currentCarryX - TARGET_RETURN_GAP_PX);
}

function setPathAnimationMetrics(path, pathLength = null) {
    const resolvedPathLength = pathLength ?? measurePathLength(path.getAttribute("d") ?? "");
    path.style.setProperty("--tag-connection-length", String(resolvedPathLength || 1));
    return resolvedPathLength || 1;
}

function revealCanvas(canvas, { animate }) {
    clearCanvasHideTimer(canvas);
    canvas.classList.remove("tag-connection-map__canvas--visible");
    canvas.classList.remove("tag-connection-map__canvas--steady");
    canvas.classList.toggle("tag-connection-map__canvas--instant", !animate);

    requestAnimationFrame(() => {
        canvas.classList.add("tag-connection-map__canvas--visible");
        if (!animate) {
            requestAnimationFrame(() => {
                canvas.classList.remove("tag-connection-map__canvas--instant");
            });
        }
    });
}

function hideCanvas(canvas) {
    if (!canvas.childNodes.length) {
        clearCanvas(canvas);
        return;
    }

    clearCanvasHideTimer(canvas);
    canvas.classList.remove("tag-connection-map__canvas--visible");
    canvas.__tagConnectionHideTimer = window.setTimeout(() => {
        clearCanvas(canvas);
    }, CONNECTION_FADE_OUT_MS);
}

function clearCanvasHideTimer(canvas) {
    if (!canvas.__tagConnectionHideTimer) {
        return;
    }

    window.clearTimeout(canvas.__tagConnectionHideTimer);
    canvas.__tagConnectionHideTimer = 0;
}

function resolveRenderMode(previousState, nextState) {
    if (!previousState || previousState.activeTag !== nextState.activeTag) {
        return "reveal";
    }

    if (previousState.pathData === nextState.pathData) {
        return "steady";
    }

    if (isPathPrefix(previousState.pathData, nextState.pathData)) {
        return "extend";
    }

    if (isPathPrefix(nextState.pathData, previousState.pathData)) {
        return "trim";
    }

    return "steady";
}

function renderConnection(canvas, leadPath, renderMode, previousState, nextState) {
    switch (renderMode) {
        case "instant":
            showCanvasSteady(canvas);
            return;
        case "reveal":
            revealCanvas(canvas, { animate: true });
            return;
        case "extend":
            extendCanvasPath(canvas, leadPath, previousState, nextState);
            return;
        case "trim":
            trimCanvasPath(canvas, leadPath, previousState, nextState);
            return;
        case "steady":
        default:
            showCanvasSteady(canvas);
    }
}

function extendCanvasPath(canvas, leadPath, previousState, nextState) {
    const previousLength = previousState?.pathLength ?? 0;
    const nextLength = nextState.pathLength;
    const preservedLength = clampNumber(previousLength, 0, nextLength);

    showCanvasSteady(canvas);
    leadPath.style.strokeDasharray = String(nextLength);
    leadPath.style.strokeDashoffset = String(Math.max(nextLength - preservedLength, 0));

    requestAnimationFrame(() => {
        canvas.classList.remove("tag-connection-map__canvas--instant");
        leadPath.style.transition = [
            "opacity 180ms ease",
            `stroke-dashoffset ${CONNECTION_EXTEND_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
        ].join(", ");
        leadPath.style.strokeDashoffset = "0";
    });
}

function trimCanvasPath(canvas, leadPath, previousState, nextState) {
    const previousLength = previousState?.pathLength ?? 0;
    const nextLength = nextState.pathLength;
    const hiddenLength = Math.max(previousLength - nextLength, 0);

    showCanvasSteady(canvas);
    leadPath.style.strokeDasharray = String(previousLength);
    leadPath.style.strokeDashoffset = "0";

    requestAnimationFrame(() => {
        canvas.classList.remove("tag-connection-map__canvas--instant");
        leadPath.style.transition = [
            "opacity 180ms ease",
            `stroke-dashoffset ${CONNECTION_TRIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
        ].join(", ");
        leadPath.style.strokeDashoffset = String(hiddenLength);
    });

    clearCanvasMorphTimer(canvas);
    canvas.__tagConnectionMorphTimer = window.setTimeout(() => {
        leadPath.setAttribute("d", nextState.pathData);
        setPathAnimationMetrics(leadPath, nextLength);
        leadPath.style.strokeDasharray = String(nextLength);
        leadPath.style.strokeDashoffset = "0";
        showCanvasSteady(canvas);
        canvas.__tagConnectionMorphTimer = 0;
    }, CONNECTION_TRIM_MS);
}

function showCanvasSteady(canvas) {
    clearCanvasHideTimer(canvas);
    clearCanvasMorphTimer(canvas);
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

function measurePathLength(pathData) {
    if (!pathData) {
        return 1;
    }

    const probePath = document.createElementNS(SVG_NAMESPACE, "path");
    probePath.setAttribute("d", pathData);
    return typeof probePath.getTotalLength === "function" ? (probePath.getTotalLength() || 1) : 1;
}

function snapCoordinate(value) {
    return Math.round(value * 2) / 2;
}

function clearCanvasMorphTimer(canvas) {
    if (!canvas.__tagConnectionMorphTimer) {
        return;
    }

    window.clearTimeout(canvas.__tagConnectionMorphTimer);
    canvas.__tagConnectionMorphTimer = 0;
}

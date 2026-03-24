const PANEL_LAYOUT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export class PanelLayoutConfig {
    // Левая панель: навигация, toggle и связанные размеры.
    static LEFT_PANEL = Object.freeze({
        laneWidthPx: 340,
        toolbarHeightPx: 24
    });

    // Средняя панель: основное содержимое урока.
    static MIDDLE_PANEL = Object.freeze({
        minWidthPx: 300,
        collapsedLeftInsetPx: 18
    });

    // Правая панель: практика, терминал и repository viewer.
    static RIGHT_PANEL = Object.freeze({
        laneWidthPx: 670
    });

    // Общие брейкпоинты для перестройки layout.
    static BREAKPOINTS = Object.freeze({
        stackedLayoutPx: 1000,
        compactPanelsPx: 960,
        mobilePanelsPx: 720
    });

    // Общие анимации и визуальные коэффициенты для панелей и оверлеев.
    static ANIMATION = Object.freeze({
        easing: PANEL_LAYOUT_EASING,
        activeMarkerEasing: "cubic-bezier(0.2, 0.9, 0.25, 1)",
        navigationToggleMs: 240,
        navigationLayoutToggleMs: 500,
        flowSubtaskEnterMs: 220,
        flowSubtaskEnterStaggerMs: 36,
        flowNodeFilterMs: 220,
        flowNodeLayoutMs: 280,
        flowSubtaskShiftMs: 220,
        overlayFadeMs: 180,
        overlayPathMs: 240,
        overlayDotDelayMs: 60,
        connectionFadeOutMs: 240,
        connectionDrawSpeedPxPerMs: 3,
        connectionMinAnimationMs: 4,
        secondaryBranchShrinkDurationFactor: 0.45,
        secondaryBranchTrunkOffsetPx: 10,
        branchDotRemovalMs: 320,
        overlayFlowSubtaskShiftMs: 260,
        activeMarker: Object.freeze({
            minHeightPx: 24,
            baseMs: 240,
            maxMs: 620,
            travelFactor: 0.95,
            sizeFactor: 0.35
        })
    });
}

export const PANEL_LAYOUT_CONFIG = Object.freeze({
    leftPanel: PanelLayoutConfig.LEFT_PANEL,
    middlePanel: PanelLayoutConfig.MIDDLE_PANEL,
    rightPanel: PanelLayoutConfig.RIGHT_PANEL,
    breakpoints: PanelLayoutConfig.BREAKPOINTS,
    animation: PanelLayoutConfig.ANIMATION
});

export const NAVIGATION_TOGGLE_ANIMATION_MS = PANEL_LAYOUT_CONFIG.animation.navigationToggleMs;
export const NAVIGATION_LAYOUT_TOGGLE_ANIMATION_MS = PANEL_LAYOUT_CONFIG.animation.navigationLayoutToggleMs;
export const FLOW_SUBTASK_ENTER_ANIMATION_MS = PANEL_LAYOUT_CONFIG.animation.flowSubtaskEnterMs;
export const FLOW_SUBTASK_ENTER_STAGGER_MS = PANEL_LAYOUT_CONFIG.animation.flowSubtaskEnterStaggerMs;

export function buildPanelLayoutInlineStyle() {
    return [
        `--navigation-lane-width: ${PANEL_LAYOUT_CONFIG.leftPanel.laneWidthPx}px`,
        `--navigation-toolbar-height: ${PANEL_LAYOUT_CONFIG.leftPanel.toolbarHeightPx}px`,
        `--navigation-collapse-duration: ${PANEL_LAYOUT_CONFIG.animation.navigationLayoutToggleMs}ms`,
        `--navigation-collapse-easing: ${PANEL_LAYOUT_CONFIG.animation.easing}`,
        `--panel-motion-easing: ${PANEL_LAYOUT_CONFIG.animation.easing}`,
        `--navigation-active-marker-easing: ${PANEL_LAYOUT_CONFIG.animation.activeMarkerEasing}`,
        `--lesson-lane-min-width: ${PANEL_LAYOUT_CONFIG.middlePanel.minWidthPx}px`,
        `--lesson-collapsed-left-inset: ${PANEL_LAYOUT_CONFIG.middlePanel.collapsedLeftInsetPx}px`,
        `--practice-lane-current-width: ${PANEL_LAYOUT_CONFIG.rightPanel.laneWidthPx}px`,
        `--flow-subtask-enter-duration: ${PANEL_LAYOUT_CONFIG.animation.flowSubtaskEnterMs}ms`,
        `--flow-subtask-enter-stagger: ${PANEL_LAYOUT_CONFIG.animation.flowSubtaskEnterStaggerMs}ms`,
        `--flow-node-filter-duration: ${PANEL_LAYOUT_CONFIG.animation.flowNodeFilterMs}ms`,
        `--flow-node-layout-duration: ${PANEL_LAYOUT_CONFIG.animation.flowNodeLayoutMs}ms`,
        `--flow-subtask-shift-duration: ${PANEL_LAYOUT_CONFIG.animation.flowSubtaskShiftMs}ms`,
        `--panel-overlay-fade-duration: ${PANEL_LAYOUT_CONFIG.animation.overlayFadeMs}ms`,
        `--panel-overlay-path-duration: ${PANEL_LAYOUT_CONFIG.animation.overlayPathMs}ms`,
        `--panel-overlay-dot-delay-duration: ${PANEL_LAYOUT_CONFIG.animation.overlayDotDelayMs}ms`,
        `--navigation-active-marker-min-height: ${PANEL_LAYOUT_CONFIG.animation.activeMarker.minHeightPx}px`
    ].join("; ");
}

export function renderPanelLayoutResponsiveStyle() {
    return `
        <style data-panel-layout-config>
            @media (max-width: ${PANEL_LAYOUT_CONFIG.breakpoints.stackedLayoutPx}px) {
                body {
                    overflow: auto;
                }

                .page-shell {
                    height: auto;
                    min-height: 100vh;
                }

                .lesson-layout {
                    grid-template-areas:
                        "navigation"
                        "lesson"
                        "practice";
                    grid-template-columns: 1fr;
                    gap: 16px;
                    height: auto;
                    padding-top: var(--navigation-toolbar-height);
                    overflow: visible;
                    background: transparent;
                }

                .lesson-layout__navigation-toggle {
                    width: 100%;
                }

                .lesson-layout__lane--navigation {
                    min-width: 0;
                    max-width: none;
                }

                .lesson-layout__lane--practice {
                    border-left: 0;
                }

                .lesson-lane {
                    min-height: auto;
                    padding: 18px;
                    border: 1px solid var(--border);
                    border-radius: 28px;
                    box-shadow: var(--shadow);
                    backdrop-filter: blur(10px);
                }

                .lesson-lane--navigation,
                .lesson-lane--lesson {
                    width: 100%;
                    min-width: 0;
                    max-width: none;
                    padding-left: 18px;
                    padding-right: 18px;
                }

                .lesson-lane--practice {
                    width: 100%;
                    min-width: 0;
                    max-width: none;
                    padding-left: 18px;
                }

                .lesson-layout__tag-connection-overlay {
                    opacity: 1;
                }

                .lesson-layout--navigation-collapsed .lesson-lane--navigation {
                    opacity: 1;
                    visibility: visible;
                    pointer-events: auto;
                    transform: none;
                    filter: none;
                }

                .lesson-layout--navigation-collapsed .lesson-lane--navigation::after,
                .lesson-layout--navigation-collapsing .lesson-lane--navigation::after {
                    opacity: 0;
                    transform: scaleX(0);
                }

                .lesson-lane--lesson,
                .lesson-layout--navigation-collapsing .lesson-lane--lesson,
                .lesson-layout--navigation-collapsed .lesson-lane--lesson {
                    transform: none;
                    animation: none;
                    box-shadow: var(--shadow);
                    will-change: auto;
                    padding-left: 18px;
                }

                .lesson-lane__body {
                    overflow: visible;
                    padding-right: 0;
                    padding-bottom: 0;
                }

                .lesson-lane--navigation .lesson-lane__body,
                .lesson-lane--navigation .lesson-lane__scroll-content {
                    direction: ltr;
                }

                .lesson-lane--navigation .lesson-lane__scroll-content,
                .lesson-lane--lesson .lesson-lane__scroll-content {
                    padding-left: 0;
                    padding-right: 0;
                }
            }

            @media (max-width: ${PANEL_LAYOUT_CONFIG.breakpoints.compactPanelsPx}px) {
                .scenario-legend__row {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .flow-block-list,
                .flow-subtask-group {
                    width: 100%;
                    min-width: 0;
                }

                .flow-block {
                    min-width: 0;
                }

                .catalog-controls__grid {
                    grid-template-columns: 1fr;
                }

                .catalog-controls__actions {
                    align-items: flex-start;
                    justify-content: flex-start;
                }
            }

            @media (max-width: ${PANEL_LAYOUT_CONFIG.breakpoints.mobilePanelsPx}px) {
                .lesson-lane {
                    padding: 18px;
                }
            }
        </style>
    `;
}

export function isCompactPanelViewport(viewportWidth = globalThis.window?.innerWidth ?? 0) {
    return Number.isFinite(viewportWidth) && viewportWidth <= PANEL_LAYOUT_CONFIG.breakpoints.compactPanelsPx;
}

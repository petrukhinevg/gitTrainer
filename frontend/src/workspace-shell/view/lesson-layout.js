import {
    buildPanelLayoutInlineStyle,
    renderPanelLayoutResponsiveStyle
} from "../panel-layout-config.js";
import {
    escapeHtml,
} from "./render-helpers.js";

export function renderLessonLayout({ state, navigationLane, lessonLane, practiceLane }) {
    const isNavigationToggleVisible = state.panelLayoutMode !== "stacked";
    const isNavigationCollapsed = Boolean(state.isNavigationEffectivelyCollapsed ?? state.isNavigationCollapsed);
    const isNavigationCollapsing = Boolean(state.isNavigationCollapsing);
    const isNavigationTransitioning = !isNavigationCollapsed && state.isNavigationExpandedReady === false;
    const isPracticeHidden = state.route !== "exercise";
    const isCompactNavigationOverlay = state.panelLayoutMode === "navigation-collapsed"
        && (Boolean(state.isCompactNavigationVisible) || isNavigationCollapsing);
    const isCompactNavigationVisible = state.panelLayoutMode === "navigation-collapsed"
        && Boolean(state.isCompactNavigationVisible);
    const navigationToggleLabel = state.panelLayoutMode === "navigation-collapsed"
        ? (isNavigationCollapsed ? "Показать левую панель" : "Показать среднюю панель")
        : (isNavigationCollapsed ? "Показать левую панель" : "Скрыть левую панель");

    return `
        ${renderPanelLayoutResponsiveStyle()}
        <section
            class="lesson-layout lesson-layout--${escapeHtml(state.route)} ${isNavigationCollapsed ? "lesson-layout--navigation-collapsed" : ""} ${isNavigationCollapsing ? "lesson-layout--navigation-collapsing" : ""} ${isNavigationTransitioning ? "lesson-layout--navigation-transitioning" : ""} ${isCompactNavigationOverlay ? "lesson-layout--compact-navigation-overlay" : ""} ${isCompactNavigationVisible ? "lesson-layout--compact-navigation-visible" : ""} ${isPracticeHidden ? "lesson-layout--practice-hidden" : ""}"
            aria-label="Рабочее пространство урока"
            style="${escapeHtml(buildPanelLayoutInlineStyle())}"
        >
            <button
                class="lesson-layout__navigation-toggle"
                type="button"
                data-navigation-visibility-toggle
                data-navigation-visibility-state="${isNavigationCollapsed ? "collapsed" : "expanded"}"
                aria-controls="lesson-navigation-lane"
                aria-expanded="${isNavigationCollapsed ? "false" : "true"}"
                aria-label="${navigationToggleLabel}"
                title="${navigationToggleLabel}"
                ${isNavigationToggleVisible ? "" : "hidden aria-hidden=\"true\""}
            >
                <span class="lesson-layout__navigation-toggle-icon" data-navigation-visibility-label>
                    ${isNavigationCollapsed ? ">" : "<"}
                </span>
                <span class="lesson-layout__navigation-toggle-text">Панель</span>
            </button>
            <div class="lesson-layout__lane lesson-layout__lane--navigation" id="lesson-navigation-lane">
                ${navigationLane}
            </div>
            <div class="lesson-layout__lane lesson-layout__lane--lesson">
                ${lessonLane}
            </div>
            <div class="lesson-layout__lane lesson-layout__lane--practice" ${isPracticeHidden ? 'aria-hidden="true" inert' : ""}>
                ${practiceLane}
            </div>
            <svg
                class="lesson-layout__tag-connection-overlay tag-connection-map__canvas"
                data-tag-connection-canvas
                aria-hidden="true"
            ></svg>
        </section>
    `;
}

export function renderLessonLane({ lane, label, title, description, meta = [], body, showHeader = true }) {
    return `
        <section class="lesson-lane lesson-lane--${escapeHtml(lane)} panel">
            ${showHeader ? `
                <header class="lesson-lane__header">
                    <div class="lesson-lane__heading">
                        <p class="panel-label">${escapeHtml(label)}</p>
                        <h3>${escapeHtml(title)}</h3>
                        <p class="panel-copy">${escapeHtml(description)}</p>
                    </div>
                    ${renderLaneMeta(meta)}
                </header>
            ` : ""}
            <div class="lesson-lane__body">
                <div class="lesson-lane__scroll-content">
                    ${body}
                </div>
            </div>
        </section>
    `;
}

function renderLaneMeta(meta) {
    if (!Array.isArray(meta) || meta.length === 0) {
        return "";
    }

    return `
        <div class="lesson-lane__meta">
            ${meta.map((item) => `
                <span class="lesson-lane__meta-chip">${escapeHtml(item)}</span>
            `).join("")}
        </div>
    `;
}

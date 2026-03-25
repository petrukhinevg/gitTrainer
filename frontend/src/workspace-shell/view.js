import { renderLessonLayout } from "./view/lesson-layout.js";
import { renderLayoutTopStrip, renderMainPanel, renderMainPanelContent } from "./view/main-panel.js";
import { renderSidebarPanel, renderSidebarPanelContent } from "./view/sidebar-panel.js";
import { renderRouteNotFound } from "./view/workspace-intro.js";
import { renderWorkspacePanel, renderWorkspacePanelSections } from "./view/workspace-panel.js";

export function renderCatalogWorkspace({ state, selectedCatalogScenario, tagOptions, providerOptions }) {
    if (state.route === "not-found") {
        return renderRouteNotFound();
    }

    return `
        ${renderLessonLayout({
            state,
            topStrip: renderLayoutTopStrip(state),
            navigationLane: renderSidebarPanel(state, selectedCatalogScenario, tagOptions),
            lessonLane: renderMainPanel(state, { tagOptions, providerOptions }),
            practiceLane: renderWorkspacePanel(state)
        })}
    `;
}

export function renderCatalogWorkspaceShell() {
    return `
        ${renderLessonLayout({
            state: { route: "catalog" },
            topStrip: "",
            navigationLane: renderSurfaceLaneShell("navigation"),
            lessonLane: renderSurfaceLaneShell("lesson"),
            practiceLane: renderPracticeLaneShell()
        })}
    `;
}

export function renderCatalogWorkspaceSurfaces({ state, selectedCatalogScenario, tagOptions, providerOptions }) {
    const practiceSections = renderWorkspacePanelSections(state);

    return {
        topStrip: renderLayoutTopStrip(state),
        navigation: renderSidebarPanelContent(state, selectedCatalogScenario, tagOptions),
        lesson: renderMainPanelContent(state, { tagOptions, providerOptions }),
        practiceViewer: practiceSections.viewer,
        practiceSurface: practiceSections.surface
    };
}

function renderSurfaceSlot(name) {
    return `<div data-render-surface="${name}"></div>`;
}

function renderSurfaceLaneShell(name) {
    return `
        <section class="lesson-lane lesson-lane--${name} panel">
            <div class="lesson-lane__body">
                <div class="lesson-lane__scroll-content">
                    ${name === "navigation" ? renderNavigationMarkerShell() : ""}
                    ${renderSurfaceSlot(name)}
                </div>
            </div>
        </section>
    `;
}

function renderNavigationMarkerShell() {
    return `
        <div class="navigation-flow-rail navigation-flow-rail--shell" data-navigation-active-marker-shell aria-hidden="true">
            <span class="navigation-flow-rail__line"></span>
            <span class="navigation-flow-rail__marker" data-navigation-active-marker></span>
        </div>
    `;
}

function renderPracticeLaneShell() {
    return `
        <section class="lesson-lane lesson-lane--practice panel">
            <div class="lesson-lane__body">
                <div class="lesson-lane__scroll-content">
                    <div class="practice-stack">
                        <div class="practice-pane practice-pane--viewer">
                            <div data-render-surface="practice-viewer"></div>
                        </div>
                        <div class="practice-pane practice-pane--surface">
                            <div data-render-surface="practice-surface"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

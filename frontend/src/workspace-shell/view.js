import { renderLessonLayout } from "./view/lesson-layout.js";
import { renderMainPanel, renderMainPanelContent } from "./view/main-panel.js";
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
            navigationLane: renderSurfaceLaneShell("navigation"),
            lessonLane: renderSurfaceLaneShell("lesson"),
            practiceLane: renderPracticeLaneShell()
        })}
    `;
}

export function renderCatalogWorkspaceSurfaces({ state, selectedCatalogScenario, tagOptions, providerOptions }) {
    const practiceSections = renderWorkspacePanelSections(state);

    return {
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
                    ${renderSurfaceSlot(name)}
                </div>
            </div>
        </section>
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

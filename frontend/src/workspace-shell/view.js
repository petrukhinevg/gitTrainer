import { renderLessonLayout } from "./view/lesson-layout.js";
import { renderMainPanel } from "./view/main-panel.js";
import { renderSidebarPanel } from "./view/sidebar-panel.js";
import { renderRouteNotFound, renderWorkspaceIntro } from "./view/workspace-intro.js";
import { renderWorkspacePanel } from "./view/workspace-panel.js";

export function renderCatalogWorkspace({ state, selectedCatalogScenario, tagOptions }) {
    if (state.route === "not-found") {
        return renderRouteNotFound();
    }

    return `
        ${state.route === "exercise" ? "" : renderWorkspaceIntro(state)}
        ${renderLessonLayout({
            state,
            navigationLane: renderSidebarPanel(state, selectedCatalogScenario, tagOptions),
            lessonLane: renderMainPanel(state),
            practiceLane: renderWorkspacePanel(state)
        })}
    `;
}

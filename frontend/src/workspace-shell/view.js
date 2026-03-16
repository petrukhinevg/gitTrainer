import { renderLessonLayout } from "./view/lesson-layout.js";
import { renderMainPanel } from "./view/main-panel.js";
import { renderSidebarPanel } from "./view/sidebar-panel.js";
import { renderRouteNotFound } from "./view/workspace-intro.js";
import { renderWorkspacePanel } from "./view/workspace-panel.js";

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

import { renderMainPanel } from "./view/main-panel.js";
import { renderSidebarPanel } from "./view/sidebar-panel.js";
import { renderRouteNotFound, renderWorkspaceIntro } from "./view/workspace-intro.js";
import { renderWorkspacePanel } from "./view/workspace-panel.js";

export function renderCatalogWorkspace({ state, selectedCatalogScenario, tagOptions }) {
    if (state.route === "not-found") {
        return renderRouteNotFound();
    }

    return `
        ${renderWorkspaceIntro(state)}
        <section class="workspace-grid">
            ${renderSidebarPanel(state, selectedCatalogScenario, tagOptions)}
            ${renderMainPanel(state)}
            ${renderWorkspacePanel(state)}
        </section>
    `;
}

import {
    escapeHtml,
    resolveDetailStatusLabel,
    resolveIntroDescription,
    resolveIntroTitle
} from "./render-helpers.js";

export function renderRouteNotFound() {
    return `
        <section class="workspace-intro panel">
            <p class="panel-label">Route shell</p>
            <h2>Unknown route</h2>
            <p>The standalone frontend keeps learner navigation inside one shell, but only <code>#/catalog</code> and <code>#/exercise/&lt;slug&gt;</code> are wired right now.</p>
        </section>
    `;
}

export function renderWorkspaceIntro(state) {
    return `
        <section class="workspace-intro panel">
            <div class="workspace-intro__copy">
                <p class="panel-label">Standalone frontend</p>
                <h2>${escapeHtml(resolveIntroTitle(state))}</h2>
                <p>${escapeHtml(resolveIntroDescription(state))}</p>
            </div>
            <div class="workspace-intro__meta">
                <div class="workspace-chip">Route: ${escapeHtml(state.route)}</div>
                <div class="workspace-chip">Provider: ${escapeHtml(state.providerName)}</div>
                <div class="workspace-chip">Catalog: ${escapeHtml(state.catalog.status)}</div>
                <div class="workspace-chip">Detail: ${escapeHtml(resolveDetailStatusLabel(state))}</div>
            </div>
        </section>
    `;
}

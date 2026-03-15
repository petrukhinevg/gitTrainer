import {
    escapeHtml,
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

function resolveIntroTitle(state) {
    if (state.route !== "exercise") {
        return "Catalog browsing and route handoff now share one shell";
    }

    if (state.detail.status === "ready") {
        return state.detail.data.title;
    }

    if (state.detail.status === "error") {
        return "Exercise route keeps a stable error boundary";
    }

    return "Exercise route is loading provider-backed detail";
}

function resolveIntroDescription(state) {
    if (state.route !== "exercise") {
        return "The catalog still owns selection and provider state, but the shell is now locked into the same three-lane lesson frame that exercise routes will use.";
    }

    if (state.detail.status === "ready") {
        return "The learner has already left the catalog and landed in a stable left-navigation, center-lesson, and right-practice layout backed by the route-specific detail payload.";
    }

    if (state.detail.status === "error") {
        return "The route is preserved and the full three-lane workspace shell stays mounted even when scenario detail loading fails.";
    }

    return "The exercise route now loads through a dedicated provider seam, with the full lesson layout already in place before deeper task and practice surfaces are implemented.";
}

function resolveDetailStatusLabel(state) {
    return state.route === "exercise" ? state.detail.status : "inactive";
}

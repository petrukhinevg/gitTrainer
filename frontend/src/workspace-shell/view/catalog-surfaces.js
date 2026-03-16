import {
    encodeHashSegment,
    escapeHtml,
    formatDifficulty
} from "./render-helpers.js";

export function renderCatalogOverviewState(state) {
    switch (state.catalog.status) {
        case "loading":
            return `
                <div class="scenario-list skeleton-list" aria-hidden="true">
                    ${Array.from({length: 3}, () => `
                        <article class="scenario-card skeleton-card">
                            <div class="skeleton-line skeleton-line-short"></div>
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line"></div>
                            <div class="skeleton-tag-row">
                                <span class="skeleton-pill"></span>
                                <span class="skeleton-pill"></span>
                            </div>
                        </article>
                    `).join("")}
                </div>
            `;
        case "error":
            return `
                <section class="catalog-state catalog-state-error">
                    <strong>Provider unavailable</strong>
                    <p>${escapeHtml(state.catalog.error ?? "The selected catalog source failed before returning items.")}</p>
                </section>
            `;
        case "empty":
            return `
                <section class="catalog-state catalog-state-empty">
                    <strong>No scenarios in this slice</strong>
                    <p>Relax the active filters to repopulate the scenario map.</p>
                </section>
            `;
        default:
            return `
                <div class="scenario-preview">
                    <p class="control-label">Current preview</p>
                    <h4>No scenario selected yet</h4>
                    <p class="panel-copy">Choose a scenario from the map or card list to drive the workspace handoff intentionally.</p>
                </div>
                <div class="scenario-list">
                    ${state.catalog.items.map(renderScenarioCard).join("")}
                </div>
            `;
    }
}

export function renderScenarioRail(state, selectedCatalogScenario) {
    switch (state.catalog.status) {
        case "loading":
            return `<p class="panel-copy">Loading scenario links for the shared workspace shell.</p>`;
        case "error":
            return `<p class="panel-copy">${escapeHtml(state.catalog.error ?? "Catalog source is unavailable.")}</p>`;
        case "empty":
            return `<p class="panel-copy">No scenarios match the current query.</p>`;
        default:
            return `
                <div class="scenario-rail__list">
                    ${state.catalog.items.map((item) => renderScenarioRailLink(item, selectedCatalogScenario)).join("")}
                </div>
            `;
    }
}

function renderScenarioRailLink(item, selectedCatalogScenario) {
    const isActive = item.slug === selectedCatalogScenario?.slug;
    return `
        <a class="scenario-link ${isActive ? "scenario-link--active" : ""}" href="#/exercise/${encodeHashSegment(item.slug)}">
            <span>${escapeHtml(item.title)}</span>
            <span class="scenario-link__meta">${escapeHtml(formatDifficulty(item.difficulty))}</span>
        </a>
    `;
}

function renderScenarioCard(item) {
    return `
        <article class="scenario-card">
            <div class="scenario-card-header">
                <span class="difficulty-pill difficulty-${escapeHtml(item.difficulty)}">${escapeHtml(formatDifficulty(item.difficulty))}</span>
                <span class="scenario-slug">${escapeHtml(item.slug)}</span>
            </div>
            <h4>${escapeHtml(item.title)}</h4>
            <p class="panel-copy">${escapeHtml(item.summary)}</p>
            <div class="scenario-tags">
                ${item.tags.map((tag) => `<span class="scenario-tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
            <div class="scenario-card-footer">
                <a class="scenario-action" href="#/exercise/${encodeHashSegment(item.slug)}">Open scenario</a>
                <span class="entry-note">Route handoff now resolves detail through a dedicated provider seam.</span>
            </div>
        </article>
    `;
}

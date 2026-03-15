import { renderScenarioRail } from "./catalog-surfaces.js";
import {
    escapeHtml,
    renderDifficultyOption,
    renderProviderOption,
    renderSortOption,
    resolveLeftPanelTitle
} from "./render-helpers.js";

export function renderSidebarPanel(state, selectedCatalogScenario, tagOptions) {
    return `
        <aside class="panel panel--sidebar">
            <p class="panel-label">${escapeHtml(resolveLeftPanelTitle(state))}</p>
            <h3>Browse controls and route entry</h3>
            <p class="panel-copy">
                The catalog and exercise detail providers are now separate seams. Query controls still shape browsing, while the exercise route loads scenario detail by slug through its own boundary.
            </p>
            <form class="catalog-controls" data-catalog-controls>
                <label>
                    <span class="control-label">Provider</span>
                    <select name="provider">
                        ${renderProviderOption(state, "local-fixture", "Local fixture")}
                        ${renderProviderOption(state, "backend-api", "Backend API")}
                        ${renderProviderOption(state, "fixture-unavailable", "Unavailable fixture")}
                    </select>
                </label>
                <label>
                    <span class="control-label">Difficulty</span>
                    <select name="difficulty">
                        ${renderDifficultyOption(state, null, "All difficulties")}
                        ${renderDifficultyOption(state, "beginner", "Beginner")}
                        ${renderDifficultyOption(state, "intermediate", "Intermediate")}
                    </select>
                </label>
                <label>
                    <span class="control-label">Sort</span>
                    <select name="sort">
                        ${renderSortOption(state, "title", "Title")}
                        ${renderSortOption(state, "difficulty", "Difficulty")}
                    </select>
                </label>
                <fieldset>
                    <legend class="control-label">Tags</legend>
                    <div class="tag-grid">
                        ${tagOptions.map((tag) => `
                            <label class="tag-option">
                                <input
                                    type="checkbox"
                                    name="tag"
                                    value="${escapeHtml(tag)}"
                                    ${state.query.tags.includes(tag) ? "checked" : ""}
                                >
                                <span>${escapeHtml(tag)}</span>
                            </label>
                        `).join("")}
                    </div>
                </fieldset>
                <div class="control-actions">
                    <button type="submit">Reload workspace</button>
                    <button type="button" data-reset-query>Reset</button>
                </div>
            </form>

            <div class="scenario-rail">
                <div class="scenario-rail__header">
                    <span class="control-label">Scenario quick links</span>
                    <strong>${state.catalog.items.length}</strong>
                </div>
                ${renderScenarioRail(state, selectedCatalogScenario)}
            </div>
        </aside>
    `;
}

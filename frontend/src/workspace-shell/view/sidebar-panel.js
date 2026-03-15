import { renderScenarioRail } from "./catalog-surfaces.js";
import { renderLessonLane } from "./lesson-layout.js";
import {
    escapeHtml,
} from "./render-helpers.js";

export function renderSidebarPanel(state, selectedCatalogScenario, tagOptions) {
    return renderLessonLane({
        lane: "navigation",
        label: resolveLeftPanelTitle(state),
        title: resolveNavigationTitle(state),
        description: resolveNavigationDescription(state),
        meta: [
            `Route: ${state.route}`,
            `Provider: ${state.providerName}`,
            `Catalog: ${state.catalog.status}`
        ],
        body: `
            <section class="lane-summary">
                <div class="lane-summary__header">
                    <span class="control-label">Workspace entry</span>
                    <span class="lane-summary__badge">${escapeHtml(resolveNavigationBadge(state))}</span>
                </div>
                <dl class="result-summary">
                    <div>
                        <dt>Selected scenario</dt>
                        <dd>${escapeHtml(state.selectedScenarioSlug ?? "Not selected")}</dd>
                    </div>
                    <div>
                        <dt>Quick links</dt>
                        <dd>${state.catalog.items.length}</dd>
                    </div>
                    <div>
                        <dt>Detail flow</dt>
                        <dd>${escapeHtml(state.route === "exercise" ? state.detail.status : "inactive")}</dd>
                    </div>
                </dl>
            </section>

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
        `
    });
}

function resolveLeftPanelTitle(state) {
    if (state.route === "exercise" && state.detail.status === "ready") {
        return state.detail.data.workspace.shell.leftPanelTitle;
    }

    return "Navigation lane";
}

function resolveNavigationTitle(state) {
    if (state.route === "exercise") {
        return "Keep route entry and scenario switching on the left";
    }

    return "Shape the route before the learner enters the lesson";
}

function resolveNavigationDescription(state) {
    if (state.route === "exercise") {
        return "This lane stays reserved for lesson navigation and route switching while the center and right lanes focus on task reading and practice scaffolding.";
    }

    return "Provider and query controls still drive the catalog, but the shell is now locked into the same three-lane lesson structure used by exercise routes.";
}

function resolveNavigationBadge(state) {
    if (state.route === "exercise") {
        return "exercise route";
    }

    return "catalog route";
}

function renderProviderOption(state, value, label) {
    return `<option value="${value}" ${state.providerName === value ? "selected" : ""}>${label}</option>`;
}

function renderDifficultyOption(state, value, label) {
    return `<option value="${value ?? ""}" ${state.query.difficulty === value ? "selected" : ""}>${label}</option>`;
}

function renderSortOption(state, value, label) {
    const selectedSort = state.query.sort ?? "title";
    return `<option value="${value}" ${selectedSort === value ? "selected" : ""}>${label}</option>`;
}

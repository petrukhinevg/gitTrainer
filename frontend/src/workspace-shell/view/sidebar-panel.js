import { renderScenarioRail } from "./catalog-surfaces.js";
import { renderLessonNavigationRail } from "./lesson-navigation.js";
import {
    escapeHtml,
} from "./render-helpers.js";

export function renderSidebarPanel(state, selectedCatalogScenario, tagOptions) {
    if (state.route === "exercise") {
        return renderExerciseSidebarPanel(state);
    }

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

function renderExerciseSidebarPanel(state) {
    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return `
            <aside class="panel panel--sidebar">
                <p class="panel-label">Lesson navigation</p>
                <h3>Lesson rail is reserving the left lane</h3>
                <p class="panel-copy">
                    The learner already entered the exercise route. The left lane now holds space for lesson navigation even while detail is still loading.
                </p>
                <div class="lesson-rail__summary">
                    <span class="control-label">Route state</span>
                    <strong>${escapeHtml(state.selectedScenarioSlug ?? "unknown scenario")}</strong>
                    <p class="panel-copy">Once the detail provider responds, this lane turns into a structured lesson map with current, upcoming, and locked stops.</p>
                </div>
            </aside>
        `;
    }

    if (state.detail.status === "error") {
        return `
            <aside class="panel panel--sidebar">
                <p class="panel-label">Lesson navigation</p>
                <h3>Lesson rail is unavailable for this route</h3>
                <p class="panel-copy">
                    The left lane keeps a coherent unavailable state when the selected scenario detail provider fails before lesson data can be mapped into navigation stops.
                </p>
                <div class="lesson-rail__summary">
                    <span class="control-label">Requested route</span>
                    <strong>${escapeHtml(state.selectedScenarioSlug ?? "unknown scenario")}</strong>
                    <p class="panel-copy">${escapeHtml(state.detail.error ?? "Unknown scenario detail error")}</p>
                </div>
                <a class="scenario-action scenario-action--muted" href="#/catalog">Back to catalog</a>
            </aside>
        `;
    }

    return `
        <aside class="panel panel--sidebar">
            <p class="panel-label">${escapeHtml(resolveLeftPanelTitle(state))}</p>
            <h3>Lesson navigation rail</h3>
            <p class="panel-copy">
                The left lane now behaves like a lesson navigator instead of a control drawer, helping the learner scan what is active now and what stays for later.
            </p>
            ${renderLessonNavigationRail(state.detail.data)}
        </aside>
    `;
}

function resolveLeftPanelTitle(state) {
    if (state.route === "exercise" && state.detail.status === "ready") {
        return state.detail.data.workspace.shell.leftPanelTitle;
    }

    return "Scenario map";
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

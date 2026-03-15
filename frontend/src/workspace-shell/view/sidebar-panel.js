import { renderScenarioRail } from "./catalog-surfaces.js";
import { renderLessonLane } from "./lesson-layout.js";
import { renderLessonNavigationRail } from "./lesson-navigation.js";
import {
    escapeHtml,
} from "./render-helpers.js";

export function renderSidebarPanel(state, selectedCatalogScenario, tagOptions) {
    if (state.route === "exercise") {
        return renderExerciseNavigationLane(state);
    }

    return renderLessonLane({
        lane: "navigation",
        label: resolveLeftPanelTitle(state),
        title: "Shape the route before the learner enters the lesson",
        description: "Provider and query controls still drive the catalog, but the shell is now locked into the same three-lane lesson structure used by exercise routes.",
        meta: [
            `Route: ${state.route}`,
            `Provider: ${state.providerName}`,
            `Catalog: ${state.catalog.status}`
        ],
        body: `
            <section class="lane-summary">
                <div class="lane-summary__header">
                    <span class="control-label">Workspace entry</span>
                    <span class="lane-summary__badge">catalog route</span>
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
                        <dd>inactive</dd>
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

function renderExerciseNavigationLane(state) {
    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return renderLessonLane({
            lane: "navigation",
            label: "Lesson navigation",
            title: "Lesson rail is reserving the left lane",
            description: "The learner already entered the exercise route. The left lane now holds space for lesson navigation even while detail is still loading.",
            meta: [
                `Route: ${state.route}`,
                `Detail: ${state.detail.status}`
            ],
            body: `
                <section class="lesson-rail__summary">
                    <span class="control-label">Route state</span>
                    <strong>${escapeHtml(state.selectedScenarioSlug ?? "unknown scenario")}</strong>
                    <p class="panel-copy">Once the detail provider responds, this lane turns into a structured lesson map with current, upcoming, and locked stops.</p>
                </section>
            `
        });
    }

    if (state.detail.status === "error") {
        return renderLessonLane({
            lane: "navigation",
            label: "Lesson navigation",
            title: "Lesson rail is unavailable for this route",
            description: "The left lane keeps a coherent unavailable state when the selected scenario detail provider fails before lesson data can be mapped into navigation stops.",
            meta: [
                `Provider: ${state.providerName}`,
                "Detail: error"
            ],
            body: `
                <section class="lesson-rail__summary">
                    <span class="control-label">Requested route</span>
                    <strong>${escapeHtml(state.selectedScenarioSlug ?? "unknown scenario")}</strong>
                    <p class="panel-copy">${escapeHtml(state.detail.error ?? "Unknown scenario detail error")}</p>
                </section>
                <div class="lesson-rail__footer">
                    <a class="scenario-action scenario-action--muted" href="#/catalog">Back to catalog</a>
                </div>
            `
        });
    }

    const detail = state.detail.data;
    return renderLessonLane({
        lane: "navigation",
        label: detail.workspace.shell.leftPanelTitle,
        title: "Lesson navigation rail",
        description: "The left lane now keeps both the task list and the exercise overview available without displacing the lesson or practice columns.",
        meta: [
            `Difficulty: ${detail.difficulty}`,
            `Source: ${detail.meta.source}`,
            `Task: ${detail.workspace.task.status}`,
            `View: ${state.exerciseSidebarTab}`
        ],
        body: `
            <div class="lane-switcher" role="tablist" aria-label="Exercise sidebar">
                ${renderSidebarTabButton(state, "tasks", "Task list")}
                ${renderSidebarTabButton(state, "overview", "Overview")}
            </div>
            ${state.exerciseSidebarTab === "overview"
                ? renderExerciseOverview(detail)
                : renderLessonNavigationRail(detail)}
        `
    });
}

function resolveLeftPanelTitle(state) {
    if (state.route === "exercise" && state.detail.status === "ready") {
        return state.detail.data.workspace.shell.leftPanelTitle;
    }

    return "Navigation lane";
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

function renderSidebarTabButton(state, value, label) {
    const isActive = state.exerciseSidebarTab === value;
    return `
        <button
            type="button"
            class="lane-switcher__button ${isActive ? "lane-switcher__button--active" : ""}"
            data-exercise-sidebar-tab="${value}"
            aria-pressed="${isActive}"
        >
            ${label}
        </button>
    `;
}

function renderExerciseOverview(detail) {
    const task = detail.workspace.task;
    const repositoryContext = detail.workspace.repositoryContext;
    return `
        <section class="lesson-rail__summary">
            <span class="control-label">Welcome task</span>
            <strong>${escapeHtml(detail.title)}</strong>
            <p class="panel-copy">${escapeHtml(detail.summary)}</p>
            <div class="lesson-rail__meta">
                <span class="lesson-rail__meta-pill">Instructions: ${task.instructions.length}</span>
                <span class="lesson-rail__meta-pill">Steps: ${task.steps.length}</span>
                <span class="lesson-rail__meta-pill">Branches: ${repositoryContext.branches.length}</span>
            </div>
        </section>
        <section class="lesson-rail__summary">
            <span class="control-label">What stays visible</span>
            <p class="panel-copy">Task selection stays on the left, the active lesson stays in the center, and the practice surface remains visible on the right even while one column scrolls deeper than the others.</p>
            <dl class="result-summary">
                <div>
                    <dt>Task goal</dt>
                    <dd>${escapeHtml(task.goal)}</dd>
                </div>
                <div>
                    <dt>Source</dt>
                    <dd>${escapeHtml(detail.meta.source)}</dd>
                </div>
                <div>
                    <dt>Stub payload</dt>
                    <dd>${escapeHtml(String(detail.meta.stub))}</dd>
                </div>
            </dl>
        </section>
    `;
}

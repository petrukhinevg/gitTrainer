import "./styles.css";
import {
    createBackendApiCatalogProvider,
    createLocalFixtureCatalogProvider,
    createUnavailableFixtureCatalogProvider
} from "./catalog/catalog-provider.js";
import { CATALOG_TAG_OPTIONS, FIXTURE_SCENARIO_CATALOG } from "./catalog/catalog-fixtures.js";

const providerFactories = Object.freeze({
    "local-fixture": () => createLocalFixtureCatalogProvider(),
    "backend-api": () => createBackendApiCatalogProvider(),
    "fixture-unavailable": () => createUnavailableFixtureCatalogProvider()
});

const DEFAULT_PROVIDER_NAME = "local-fixture";
const DEFAULT_QUERY = Object.freeze({
    difficulty: null,
    tags: [],
    sort: null
});

const state = {
    route: "catalog",
    selectedScenarioSlug: null,
    status: "idle",
    query: cloneQuery(DEFAULT_QUERY),
    catalog: null,
    error: null,
    providerName: DEFAULT_PROVIDER_NAME
};

const appRoot = document.querySelector("#app");
let latestCatalogRequestId = 0;

async function bootstrapCatalogApp() {
    window.addEventListener("hashchange", handleRouteChange);

    if (!window.location.hash) {
        window.location.hash = "#/catalog";
        return;
    }

    await handleRouteChange();
}

async function handleRouteChange() {
    const route = parseRoute(window.location.hash);
    state.route = route.name;
    state.selectedScenarioSlug = route.scenarioSlug;
    render();

    if (state.route !== "catalog") {
        return;
    }

    await loadCatalog();
}

function parseRoute(hash) {
    if (hash === "#/catalog") {
        return {
            name: "catalog",
            scenarioSlug: null
        };
    }

    const exerciseMatch = hash.match(/^#\/exercise\/([^/?#]+)$/);
    if (exerciseMatch) {
        return {
            name: "exercise",
            scenarioSlug: decodeURIComponent(exerciseMatch[1])
        };
    }

    return {
        name: "not-found",
        scenarioSlug: null
    };
}

async function loadCatalog() {
    const requestId = ++latestCatalogRequestId;
    const providerName = state.providerName;
    const querySnapshot = cloneQuery(state.query);

    state.status = "loading";
    state.catalog = null;
    state.error = null;
    render();

    try {
        const providerFactory = providerFactories[providerName];
        if (!providerFactory) {
            throw new Error(`Unknown catalog provider: ${providerName}`);
        }
        const provider = providerFactory();
        const catalog = await provider.browseCatalog(querySnapshot);
        if (requestId !== latestCatalogRequestId) {
            return;
        }

        state.catalog = catalog;
        state.status = state.catalog.items.length === 0 ? "empty" : "ready";
    } catch (error) {
        if (requestId !== latestCatalogRequestId) {
            return;
        }

        state.catalog = null;
        state.error = error instanceof Error ? error.message : "Unknown catalog error";
        state.status = "error";
    }

    if (requestId !== latestCatalogRequestId) {
        return;
    }

    render();
}

function render() {
    if (state.route === "not-found") {
        appRoot.innerHTML = `
            <section class="hero-panel">
                <p class="panel-label">Route shell</p>
                <h2>Unknown route</h2>
                <p>The SPA shell is active, but only <code>#/catalog</code> and <code>#/exercise/&lt;slug&gt;</code> are wired in this epic.</p>
            </section>
        `;
        return;
    }

    if (state.route === "exercise") {
        renderExerciseHandoff();
        return;
    }

    const catalogItems = state.catalog?.items ?? [];
    const meta = state.catalog?.meta ?? {
        source: state.providerName,
        query: state.query
    };
    const statusCopy = describeStatus();

    appRoot.innerHTML = `
        <section class="hero-panel">
            <p class="panel-label">Scenario Catalog</p>
            <h2>Catalog summaries are now browseable.</h2>
            <p>
                Query controls and provider switching stay intact, while this slice upgrades the catalog from a debug
                boundary preview into learner-facing scenario cards with entry-action presentation.
            </p>
            <div class="provider-badge">Provider: ${escapeHtml(state.providerName)}</div>
        </section>

        <section class="grid two-up">
            <article class="panel">
                <p class="panel-label">Screen state</p>
                <h3>Current catalog boundary</h3>
                <div class="metrics">
                    <div class="metric">
                        <span class="metric-label">Route</span>
                        <strong class="metric-value">${escapeHtml(state.route)}</strong>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Status</span>
                        <strong class="metric-value">${escapeHtml(state.status)}</strong>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Items loaded</span>
                        <strong class="metric-value">${catalogItems.length}</strong>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Active tags</span>
                        <strong class="metric-value">${state.query.tags.length}</strong>
                    </div>
                </div>
            </article>

            <article class="panel">
                <p class="panel-label">Browse controls</p>
                <h3>Query and provider handling</h3>
                <p>
                    Filtering, sorting, loading, empty, and unavailable-source handling stay driven by the existing
                    browse-state model while the list surface now renders actual scenario summaries.
                </p>
                <form class="catalog-controls" data-catalog-controls>
                    <label>
                        <span class="control-label">Provider</span>
                        <select name="provider">
                            ${renderProviderOption("local-fixture", "Local fixture")}
                            ${renderProviderOption("backend-api", "Backend API")}
                            ${renderProviderOption("fixture-unavailable", "Unavailable fixture")}
                        </select>
                    </label>
                    <label>
                        <span class="control-label">Difficulty</span>
                        <select name="difficulty">
                            ${renderDifficultyOption(null, "All difficulties")}
                            ${renderDifficultyOption("beginner", "Beginner")}
                            ${renderDifficultyOption("intermediate", "Intermediate")}
                        </select>
                    </label>
                    <label>
                        <span class="control-label">Sort</span>
                        <select name="sort">
                            ${renderSortOption("title", "Title")}
                            ${renderSortOption("difficulty", "Difficulty")}
                        </select>
                    </label>
                    <fieldset>
                        <legend class="control-label">Tags</legend>
                        <div class="tag-grid">
                            ${CATALOG_TAG_OPTIONS.map((tag) => `
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
                        <button type="submit">Reload catalog</button>
                        <button type="button" data-reset-query>Reset</button>
                    </div>
                </form>
            </article>
        </section>

        <section class="catalog-results-grid">
            <article class="panel scenario-list-panel">
                <p class="panel-label">Scenario list</p>
                <h3>${escapeHtml(statusCopy.title)}</h3>
                <p>${escapeHtml(statusCopy.description)}</p>
                ${renderCatalogListSurface(catalogItems)}
            </article>

            <article class="panel result-summary-panel">
                <p class="panel-label">Result summary</p>
                <h3>Current boundary snapshot</h3>
                <p>
                    The query-state contract stays unchanged, and the entry action now hands the chosen scenario slug into
                    a stable exercise route placeholder without pulling in full detail rendering yet.
                </p>
                <dl class="result-summary">
                    <div>
                        <dt>Source</dt>
                        <dd>${escapeHtml(meta.source ?? state.providerName)}</dd>
                    </div>
                    <div>
                        <dt>Difficulty</dt>
                        <dd>${escapeHtml(meta.query?.difficulty ?? "Any")}</dd>
                    </div>
                    <div>
                        <dt>Sort</dt>
                        <dd>${escapeHtml(meta.query?.sort ?? "Default title order")}</dd>
                    </div>
                    <div>
                        <dt>Tags</dt>
                        <dd>${renderActiveFilterTags(meta.query?.tags ?? [])}</dd>
                    </div>
                </dl>
                <p class="entry-note">
                    Entry actions now open a route-level handoff screen. The full workspace still lands in issue 2.1.
                </p>
            </article>
        </section>
    `;

    bindCatalogControls();
}

function bindCatalogControls() {
    const form = document.querySelector("[data-catalog-controls]");
    if (!form) {
        return;
    }

    form.addEventListener("submit", handleCatalogControlsSubmit);
    form.querySelector("[data-reset-query]")?.addEventListener("click", resetQueryControls);
}

async function handleCatalogControlsSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    state.providerName = formData.get("provider");
    state.query = {
        difficulty: normalizeOptionalValue(formData.get("difficulty")),
        tags: formData.getAll("tag").map(String),
        sort: normalizeSortValue(formData.get("sort"))
    };

    await loadCatalog();
}

async function resetQueryControls() {
    state.providerName = DEFAULT_PROVIDER_NAME;
    state.query = cloneQuery(DEFAULT_QUERY);

    await loadCatalog();
}

function renderProviderOption(value, label) {
    return `<option value="${value}" ${state.providerName === value ? "selected" : ""}>${label}</option>`;
}

function renderDifficultyOption(value, label) {
    return `<option value="${value ?? ""}" ${state.query.difficulty === value ? "selected" : ""}>${label}</option>`;
}

function renderSortOption(value, label) {
    const selectedSort = state.query.sort ?? "title";
    return `<option value="${value}" ${selectedSort === value ? "selected" : ""}>${label}</option>`;
}

function describeStatus() {
    switch (state.status) {
        case "loading":
            return {
                title: "Loading fresh catalog results",
                description: "The card surface keeps its layout while the active provider resolves the latest catalog query."
            };
        case "empty":
            return {
                title: "No scenarios match this query",
                description: "The current filters are valid, but this combination leaves no scenario cards to choose from."
            };
        case "error":
            return {
                title: "Catalog source is unavailable",
                description: state.error ?? "The active provider failed before returning scenario summaries."
            };
        case "ready":
            return {
                title: "Filtered catalog result is ready",
                description: "The screen has a resolved provider result with scenario cards, difficulty cues, tags, and entry actions."
            };
        default:
            return {
                title: "Browse controls are ready",
                description: "Pick a provider, tune the query, and load the next set of scenario cards."
            };
    }
}

function renderCatalogListSurface(catalogItems) {
    switch (state.status) {
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
                    <p>${escapeHtml(state.error ?? "The selected catalog source failed before returning items.")}</p>
                </section>
            `;
        case "empty":
            return `
                <section class="catalog-state catalog-state-empty">
                    <strong>No scenarios in this slice</strong>
                    <p>Relax the active filters or swap providers to repopulate the catalog.</p>
                </section>
            `;
        default:
            return `
                <div class="scenario-list">
                    ${catalogItems.map(renderScenarioCard).join("")}
                </div>
            `;
    }
}

function renderScenarioCard(item) {
    return `
        <article class="scenario-card">
            <div class="scenario-card-header">
                <span class="difficulty-pill difficulty-${escapeHtml(item.difficulty)}">${escapeHtml(formatDifficulty(item.difficulty))}</span>
                <span class="scenario-slug">${escapeHtml(item.slug)}</span>
            </div>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.summary)}</p>
            <div class="scenario-tags">
                ${item.tags.map((tag) => `<span class="scenario-tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
            <div class="scenario-card-footer">
                <a class="scenario-action" href="#/exercise/${encodeHashSegment(item.slug)}">Open scenario</a>
                <span class="entry-note">Route handoff is live; workspace content ships in issue 2.1.</span>
            </div>
        </article>
    `;
}

function renderExerciseHandoff() {
    const scenario = findScenarioSummaryBySlug(state.selectedScenarioSlug);
    const heading = scenario?.title ?? formatScenarioTitleFromSlug(state.selectedScenarioSlug);

    appRoot.innerHTML = `
        <section class="hero-panel">
            <p class="panel-label">Exercise Route</p>
            <h2>${escapeHtml(heading)}</h2>
            <p>
                The catalog can now hand a learner into a stable exercise route with the selected scenario slug, while the
                full workspace shell and detail loading remain in parent issue 2.
            </p>
            <div class="provider-badge">Scenario: ${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</div>
        </section>

        <section class="catalog-results-grid">
            <article class="panel scenario-list-panel">
                <p class="panel-label">Handoff state</p>
                <h3>Scenario selection is now routable</h3>
                <p>
                    This placeholder confirms that choosing a scenario from the catalog produces a navigable route target
                    instead of a disabled control.
                </p>
                <dl class="result-summary">
                    <div>
                        <dt>Route</dt>
                        <dd>${escapeHtml(`#/exercise/${state.selectedScenarioSlug ?? ""}`)}</dd>
                    </div>
                    <div>
                        <dt>Slug</dt>
                        <dd>${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</dd>
                    </div>
                    <div>
                        <dt>Title</dt>
                        <dd>${escapeHtml(scenario?.title ?? "Authored detail arrives in issue 2.1")}</dd>
                    </div>
                </dl>
            </article>

            <article class="panel result-summary-panel">
                <p class="panel-label">Next seam</p>
                <h3>Workspace route is reserved</h3>
                <p>
                    Parent issue 2 still owns exercise detail loading, task instructions, and repository context. This
                    screen only proves the catalog can open a selected scenario into a stable route.
                </p>
                <div class="route-actions">
                    <a class="scenario-action" href="#/catalog">Back to catalog</a>
                </div>
            </article>
        </section>
    `;
}

function findScenarioSummaryBySlug(slug) {
    if (!slug) {
        return null;
    }

    return state.catalog?.items.find((item) => item.slug === slug)
        ?? FIXTURE_SCENARIO_CATALOG.items.find((item) => item.slug === slug)
        ?? null;
}

function renderActiveFilterTags(tags) {
    if (!tags.length) {
        return "Any tags";
    }

    return tags.map((tag) => escapeHtml(tag)).join(", ");
}

function formatDifficulty(value) {
    if (!value) {
        return "Unknown";
    }

    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function formatScenarioTitleFromSlug(slug) {
    if (!slug) {
        return "Unknown scenario";
    }

    return slug
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function normalizeOptionalValue(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

function normalizeSortValue(value) {
    const normalized = normalizeOptionalValue(value);
    return normalized === "title" ? null : normalized;
}

function cloneQuery(query) {
    return {
        difficulty: query.difficulty,
        tags: [...query.tags],
        sort: query.sort
    };
}

function encodeHashSegment(value) {
    return encodeURIComponent(String(value));
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

bootstrapCatalogApp();

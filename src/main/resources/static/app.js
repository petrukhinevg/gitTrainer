import {
    createBackendApiCatalogProvider,
    createLocalFixtureCatalogProvider,
    createUnavailableFixtureCatalogProvider
} from "./catalog/catalog-provider.js";
import { CATALOG_TAG_OPTIONS } from "./catalog/catalog-fixtures.js";

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
    state.route = parseRoute(window.location.hash);
    render();

    if (state.route !== "catalog") {
        return;
    }

    await loadCatalog();
}

function parseRoute(hash) {
    return hash === "#/catalog" ? "catalog" : "not-found";
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
                <p>The SPA shell is active, but only <code>#/catalog</code> is wired in issue 1.1.</p>
            </section>
        `;
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
            <h2>Catalog browse state is now interactive.</h2>
            <p>
                Query controls, provider switching, and state handling are active. Final scenario cards still stay
                intentionally deferred to issue 1.3.
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
                    Issue 1.2 owns filtering, sorting, loading, empty, and unavailable-source flow while keeping the
                    temporary debug preview instead of final catalog cards.
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

        <section class="grid two-up">
            <article class="placeholder">
                <p class="placeholder-label">Issue 1.2</p>
                <h3>${escapeHtml(statusCopy.title)}</h3>
                <p>${escapeHtml(statusCopy.description)}</p>
            </article>

            <article class="placeholder">
                <p class="placeholder-label">Issue 1.3</p>
                <h3>Scenario cards still arrive after this</h3>
                <p>
                    Final catalog rows or cards, tags, difficulty styling, and entry actions are intentionally held back so
                    this task can stay focused on browse state and controls.
                </p>
            </article>
        </section>

        <section class="debug-preview">
            <p class="panel-label">Fixture-backed preview</p>
            <h3>Contract snapshot</h3>
            <p>
                This is a debugging view of the provider result, not the final catalog presentation.
            </p>
            <code>${escapeHtml(JSON.stringify({
                meta,
                status: state.status,
                itemTitles: catalogItems.map((item) => item.title)
            }, null, 2))}</code>
            ${state.error ? `<p>Last error: ${escapeHtml(state.error)}</p>` : ""}
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
        sort: normalizeOptionalValue(formData.get("sort")) ?? "title"
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
                description: "The previous result set is cleared while the active provider resolves the latest query."
            };
        case "empty":
            return {
                title: "No scenarios match this query",
                description: "The current filters are valid, but this combination produces an empty result set."
            };
        case "error":
            return {
                title: "Catalog source is unavailable",
                description: state.error ?? "The active provider failed before returning a catalog payload."
            };
        case "ready":
            return {
                title: "Filtered catalog result is ready",
                description: "The screen has a resolved provider result and keeps final list presentation deferred to issue 1.3."
            };
        default:
            return {
                title: "Browse controls are ready",
                description: "Pick a provider, tune the query, and load the next result set."
            };
    }
}

function normalizeOptionalValue(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

function cloneQuery(query) {
    return {
        difficulty: query.difficulty,
        tags: [...query.tags],
        sort: query.sort
    };
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

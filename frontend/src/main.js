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

    if (state.route === "not-found") {
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
            <section class="workspace-intro panel">
                <p class="panel-label">Route shell</p>
                <h2>Unknown route</h2>
                <p>The standalone frontend keeps learner navigation inside one shell, but only <code>#/catalog</code> and <code>#/exercise/&lt;slug&gt;</code> are wired right now.</p>
            </section>
        `;
        return;
    }

    const catalogItems = state.catalog?.items ?? [];
    const selectedScenario = resolveSelectedScenario(catalogItems);

    appRoot.innerHTML = `
        <section class="workspace-intro panel">
            <div class="workspace-intro__copy">
                <p class="panel-label">Standalone frontend</p>
                <h2>${escapeHtml(resolveIntroTitle(selectedScenario))}</h2>
                <p>${escapeHtml(resolveIntroDescription(selectedScenario))}</p>
            </div>
            <div class="workspace-intro__meta">
                <div class="workspace-chip">Route: ${escapeHtml(state.route)}</div>
                <div class="workspace-chip">Provider: ${escapeHtml(state.providerName)}</div>
                <div class="workspace-chip">Status: ${escapeHtml(state.status)}</div>
            </div>
        </section>

        <section class="workspace-grid">
            ${renderSidebar(catalogItems, selectedScenario)}
            ${renderMainPanel(catalogItems, selectedScenario)}
            ${renderWorkspacePanel(selectedScenario)}
        </section>
    `;

    bindCatalogControls();
}

function renderSidebar(catalogItems, selectedScenario) {
    return `
        <aside class="panel panel--sidebar">
            <p class="panel-label">Scenario map</p>
            <h3>Browse controls and route entry</h3>
            <p class="panel-copy">
                Provider switching, filtering, sorting, and the current catalog seam stay intact while the learner flow now lives inside one standalone shell.
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

            <div class="scenario-rail">
                <div class="scenario-rail__header">
                    <span class="control-label">Scenario quick links</span>
                    <strong>${catalogItems.length}</strong>
                </div>
                ${renderScenarioRail(catalogItems, selectedScenario)}
            </div>
        </aside>
    `;
}

function renderMainPanel(catalogItems, selectedScenario) {
    if (state.route === "exercise") {
        return `
            <section class="panel panel--lesson">
                <p class="panel-label">Workspace lesson</p>
                <h3>${escapeHtml(selectedScenario?.title ?? formatScenarioTitleFromSlug(state.selectedScenarioSlug))}</h3>
                <p class="panel-copy">
                    Workspace route keeps the learner in the same shell as the catalog. Full detail loading, authored instructions, and repository context still belong to the later 2.1 to 2.3 tasks.
                </p>
                <div class="lesson-block">
                    <h4 class="lesson-block__title">Task prompt placeholder</h4>
                    <p class="panel-copy">
                        The chosen scenario slug is already routed into the exercise workspace. This center panel is reserved for future goal text, step ordering, and repository cues.
                    </p>
                </div>
                <div class="lesson-block">
                    <h4 class="lesson-block__title">Route handoff</h4>
                    <dl class="result-summary">
                        <div>
                            <dt>Scenario slug</dt>
                            <dd>${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</dd>
                        </div>
                        <div>
                            <dt>Catalog source</dt>
                            <dd>${escapeHtml(state.catalog?.meta?.source ?? state.providerName)}</dd>
                        </div>
                        <div>
                            <dt>Route</dt>
                            <dd>${escapeHtml(`#/exercise/${state.selectedScenarioSlug ?? ""}`)}</dd>
                        </div>
                    </dl>
                </div>
                <div class="lesson-block">
                    <h4 class="lesson-block__title">Why this task exists</h4>
                    <ul class="lesson-list">
                        <li>The learner no longer jumps between a legacy backend shell and a future SPA shell.</li>
                        <li>The catalog still owns discovery and selection.</li>
                        <li>The same shell can absorb upcoming workspace detail tasks without another route migration.</li>
                    </ul>
                </div>
            </section>
        `;
    }

    return `
        <section class="panel panel--lesson">
            <p class="panel-label">Catalog overview</p>
            <h3>Choose a scenario before opening the workspace</h3>
            <p class="panel-copy">${escapeHtml(describeStatus().description)}</p>
            ${renderCatalogOverviewState(catalogItems, selectedScenario)}
        </section>
    `;
}

function renderWorkspacePanel(selectedScenario) {
    const launchTarget = selectedScenario?.slug ?? state.selectedScenarioSlug;
    const primaryAction = launchTarget
        ? `<a class="scenario-action" href="#/exercise/${encodeHashSegment(launchTarget)}">Open scenario</a>`
        : `<a class="scenario-action scenario-action--muted" href="#/catalog">Browse catalog</a>`;

    const secondaryAction = state.route === "exercise"
        ? `<a class="scenario-link" href="#/catalog">Back to catalog</a>`
        : `<span class="scenario-link">Select a scenario to reserve the route handoff.</span>`;

    return `
        <section class="panel panel--workspace">
            <p class="panel-label">Workspace lane</p>
            <h3>Three-panel shell is ready for handoff</h3>
            <p class="panel-copy">
                The right lane stays reserved for the future answer or work area, while already proving that catalog selection and exercise routing live in the same standalone app.
            </p>
            <div class="workspace-card">
                <div class="workspace-card__header">
                    <span class="control-label">Input area</span>
                    <span class="workspace-card__badge">${escapeHtml(state.route === "exercise" ? "active route" : "catalog preview")}</span>
                </div>
                <p class="panel-copy">
                    ${escapeHtml(selectedScenario
                        ? `Scenario "${selectedScenario.title}" is the current handoff target.`
                        : "Choose any scenario from the map to drive the next exercise route.")}
                </p>
                <div class="workspace-card__actions">
                    ${primaryAction}
                    ${secondaryAction}
                </div>
            </div>
            <div class="workspace-stack">
                <section class="workspace-stack__panel">
                    <p class="panel-label">Task context</p>
                    <p class="panel-copy">Center panel owns the future task goal, ordered steps, and repository annotations.</p>
                </section>
                <section class="workspace-stack__panel">
                    <p class="panel-label">Feedback lane</p>
                    <p class="panel-copy">This space stays ready for later correctness, hint, and retry panels without another shell redesign.</p>
                </section>
            </div>
        </section>
    `;
}

function renderCatalogOverviewState(catalogItems, selectedScenario) {
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
                    <p>Relax the active filters or swap providers to repopulate the scenario map.</p>
                </section>
            `;
        default:
            return `
                <div class="scenario-preview">
                    <p class="control-label">Current preview</p>
                    <h4>${escapeHtml(selectedScenario?.title ?? "No scenario selected yet")}</h4>
                    <p class="panel-copy">${escapeHtml(selectedScenario?.summary ?? "Load catalog results to populate the workspace handoff preview.")}</p>
                    <div class="scenario-tags">
                        ${(selectedScenario?.tags ?? []).map((tag) => `<span class="scenario-tag">${escapeHtml(tag)}</span>`).join("")}
                    </div>
                </div>
                <div class="scenario-list">
                    ${catalogItems.map(renderScenarioCard).join("")}
                </div>
            `;
    }
}

function renderScenarioRail(catalogItems, selectedScenario) {
    switch (state.status) {
        case "loading":
            return `<p class="panel-copy">Loading scenario links for the shared workspace shell.</p>`;
        case "error":
            return `<p class="panel-copy">${escapeHtml(state.error ?? "Catalog source is unavailable.")}</p>`;
        case "empty":
            return `<p class="panel-copy">No scenarios match the current query.</p>`;
        default:
            return `
                <div class="scenario-rail__list">
                    ${catalogItems.map((item) => renderScenarioRailLink(item, selectedScenario)).join("")}
                </div>
            `;
    }
}

function renderScenarioRailLink(item, selectedScenario) {
    const isActive = item.slug === selectedScenario?.slug;
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
                <span class="entry-note">Route handoff stays inside the shared workspace shell.</span>
            </div>
        </article>
    `;
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

function resolveSelectedScenario(catalogItems) {
    if (state.selectedScenarioSlug) {
        return catalogItems.find((item) => item.slug === state.selectedScenarioSlug)
            ?? FIXTURE_SCENARIO_CATALOG.items.find((item) => item.slug === state.selectedScenarioSlug)
            ?? null;
    }

    return catalogItems[0] ?? null;
}

function resolveIntroTitle(selectedScenario) {
    if (state.route === "exercise") {
        return selectedScenario?.title ?? formatScenarioTitleFromSlug(state.selectedScenarioSlug);
    }

    return "Catalog browsing and route handoff now share one shell";
}

function resolveIntroDescription(selectedScenario) {
    if (state.route === "exercise") {
        return `The learner has already left the catalog and landed in the same standalone workspace shell for ${selectedScenario?.title ?? "the selected scenario"}.`;
    }

    return "The catalog still owns selection and provider state, but the learner no longer bounces between separate UI shells before entering the exercise flow.";
}

function describeStatus() {
    switch (state.status) {
        case "loading":
            return {
                description: "The shared shell is waiting for the active provider to resolve the latest catalog query."
            };
        case "empty":
            return {
                description: "The shell stays intact, but the current filters leave no scenario to route into the workspace."
            };
        case "error":
            return {
                description: state.error ?? "The active provider failed before returning scenario summaries."
            };
        case "ready":
            return {
                description: "Catalog results are ready and any listed scenario can reserve the exercise route inside this same shell."
            };
        default:
            return {
                description: "Pick a provider, tune the query, and choose which scenario should open the shared workspace route."
            };
    }
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

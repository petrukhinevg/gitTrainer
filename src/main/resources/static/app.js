import { createBackendApiCatalogProvider, createLocalFixtureCatalogProvider } from "./catalog/catalog-provider.js";

const providerRegistry = Object.freeze({
    "local-fixture": createLocalFixtureCatalogProvider(),
    "backend-api": createBackendApiCatalogProvider()
});

const state = {
    route: "catalog",
    status: "idle",
    query: {
        difficulty: null,
        tags: [],
        sort: null
    },
    catalog: null,
    error: null,
    providerName: "local-fixture"
};

const appRoot = document.querySelector("#app");

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
    state.status = "loading";
    state.error = null;
    render();

    try {
        const provider = providerRegistry[state.providerName];
        state.catalog = await provider.browseCatalog(state.query);
        state.status = "ready";
    } catch (error) {
        state.catalog = null;
        state.error = error instanceof Error ? error.message : "Unknown catalog error";
        state.status = "error";
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

    appRoot.innerHTML = `
        <section class="hero-panel">
            <p class="panel-label">Scenario Catalog</p>
            <h2>Catalog route shell is live.</h2>
            <p>
                This screen already owns the route, provider seam, and state boundary. Query controls and final scenario
                cards stay intentionally deferred to issues 1.2 and 1.3.
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
                </div>
            </article>

            <article class="panel">
                <p class="panel-label">Provider seam</p>
                <h3>Local-first, swappable later</h3>
                <p>
                    The screen currently reads from fixture-backed provider data, while a backend API provider already exists
                    behind the same contract for later integration work.
                </p>
                <div class="metrics">
                    <div class="metric">
                        <span class="metric-label">Active source</span>
                        <strong class="metric-value">${escapeHtml(meta.source)}</strong>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Difficulty</span>
                        <strong class="metric-value">${escapeHtml(meta.query?.difficulty ?? "none")}</strong>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Sort</span>
                        <strong class="metric-value">${escapeHtml(meta.query?.sort ?? "none")}</strong>
                    </div>
                </div>
            </article>
        </section>

        <section class="grid two-up">
            <article class="placeholder">
                <p class="placeholder-label">Issue 1.2</p>
                <h3>Query controls arrive next</h3>
                <p>
                    Filtering, sorting, loading, and unavailable-source UX belong to the next task, so this shell only
                    exposes the state boundary and current query snapshot.
                </p>
            </article>

            <article class="placeholder">
                <p class="placeholder-label">Issue 1.3</p>
                <h3>Scenario cards arrive after that</h3>
                <p>
                    Final catalog rows or cards, tags, difficulty styling, and entry actions are intentionally held back so
                    this issue stays focused on the route shell and provider seam.
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
                itemTitles: catalogItems.map((item) => item.title)
            }, null, 2))}</code>
            ${state.error ? `<p>Last error: ${escapeHtml(state.error)}</p>` : ""}
        </section>
    `;
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

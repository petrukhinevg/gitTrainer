import { renderCatalogWorkspace } from "./view.js";

const DEFAULT_PROVIDER_NAME = "local-fixture";
const DEFAULT_QUERY = Object.freeze({
    difficulty: null,
    tags: [],
    sort: null
});

export function createCatalogWorkspaceController({ appRoot, providerFactories, tagOptions }) {
    const state = {
        route: "catalog",
        selectedScenarioSlug: null,
        status: "idle",
        query: cloneQuery(DEFAULT_QUERY),
        catalog: null,
        error: null,
        providerName: DEFAULT_PROVIDER_NAME
    };

    let latestCatalogRequestId = 0;

    async function bootstrap() {
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

    function render() {
        const catalogItems = state.catalog?.items ?? [];
        const selectedScenario = resolveSelectedScenario(state, catalogItems);
        const selectedScenarioState = resolveSelectedScenarioState(state, selectedScenario);

        appRoot.innerHTML = renderCatalogWorkspace({
            state,
            catalogItems,
            selectedScenario,
            selectedScenarioState,
            tagOptions
        });

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

    return {
        bootstrap
    };
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

function resolveSelectedScenario(state, catalogItems) {
    if (state.route !== "exercise" || !state.selectedScenarioSlug) {
        return null;
    }

    return catalogItems.find((item) => item.slug === state.selectedScenarioSlug) ?? null;
}

function resolveSelectedScenarioState(state, selectedScenario) {
    if (state.route !== "exercise") {
        return "catalog";
    }

    if (state.status === "loading" || state.status === "idle") {
        return "loading";
    }

    if (state.status === "error") {
        return "unavailable";
    }

    if (state.status === "empty" || !selectedScenario) {
        return "missing";
    }

    return "available";
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

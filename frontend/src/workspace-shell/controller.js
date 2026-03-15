import { renderCatalogWorkspace } from "./view.js";

const DEFAULT_PROVIDER_NAME = "local-fixture";
const DEFAULT_QUERY = Object.freeze({
    difficulty: null,
    tags: [],
    sort: null
});

export function createCatalogWorkspaceController({ appRoot, catalogProviderFactories, detailProviderFactories, tagOptions }) {
    const state = {
        route: "catalog",
        selectedScenarioSlug: null,
        providerName: DEFAULT_PROVIDER_NAME,
        exerciseSidebarTab: "tasks",
        practiceContextTab: "branches",
        practiceDraft: createInitialPracticeDraft(),
        query: cloneQuery(DEFAULT_QUERY),
        catalog: {
            status: "idle",
            items: [],
            meta: null,
            error: null
        },
        detail: {
            status: "idle",
            data: null,
            error: null
        }
    };

    let latestCatalogRequestId = 0;
    let latestDetailRequestId = 0;

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
        resetRouteScopedState();
        render();

        if (state.route === "not-found") {
            return;
        }

        await Promise.all([
            loadCatalog(),
            state.route === "exercise" ? loadScenarioDetail() : Promise.resolve()
        ]);
    }

    async function loadCatalog() {
        const requestId = ++latestCatalogRequestId;
        const providerName = state.providerName;
        const querySnapshot = cloneQuery(state.query);

        state.catalog.status = "loading";
        state.catalog.items = [];
        state.catalog.meta = null;
        state.catalog.error = null;
        render();

        try {
            const providerFactory = catalogProviderFactories[providerName];
            if (!providerFactory) {
                throw new Error(`Unknown catalog provider: ${providerName}`);
            }

            const provider = providerFactory();
            const catalog = await provider.browseCatalog(querySnapshot);
            if (requestId !== latestCatalogRequestId) {
                return;
            }

            state.catalog.items = catalog.items;
            state.catalog.meta = catalog.meta;
            state.catalog.status = catalog.items.length === 0 ? "empty" : "ready";
        } catch (error) {
            if (requestId !== latestCatalogRequestId) {
                return;
            }

            state.catalog.items = [];
            state.catalog.meta = null;
            state.catalog.error = error instanceof Error ? error.message : "Unknown catalog error";
            state.catalog.status = "error";
        }

        if (requestId !== latestCatalogRequestId) {
            return;
        }

        render();
    }

    async function loadScenarioDetail() {
        if (!state.selectedScenarioSlug) {
            state.detail.status = "missing";
            state.detail.data = null;
            state.detail.error = "Scenario slug is missing from the exercise route.";
            render();
            return;
        }

        const requestId = ++latestDetailRequestId;
        const providerName = state.providerName;
        const slug = state.selectedScenarioSlug;

        state.detail.status = "loading";
        state.detail.data = null;
        state.detail.error = null;
        render();

        try {
            const providerFactory = detailProviderFactories[providerName];
            if (!providerFactory) {
                throw new Error(`Unknown scenario detail provider: ${providerName}`);
            }

            const provider = providerFactory();
            const detail = await provider.loadScenarioDetail(slug);
            if (requestId !== latestDetailRequestId) {
                return;
            }

            state.detail.data = detail;
            state.detail.status = "ready";
        } catch (error) {
            if (requestId !== latestDetailRequestId) {
                return;
            }

            state.detail.data = null;
            state.detail.error = error instanceof Error ? error.message : "Unknown scenario detail error";
            state.detail.status = "error";
        }

        if (requestId !== latestDetailRequestId) {
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

        await reloadActiveRouteData();
    }

    async function resetQueryControls() {
        state.providerName = DEFAULT_PROVIDER_NAME;
        state.query = cloneQuery(DEFAULT_QUERY);

        await reloadActiveRouteData();
    }

    function render() {
        const selectedCatalogScenario = resolveSelectedCatalogScenario(state, state.catalog.items);
        appRoot.classList.toggle("app-shell--exercise", state.route === "exercise");
        appRoot.innerHTML = renderCatalogWorkspace({
            state,
            selectedCatalogScenario,
            tagOptions
        });

        bindCatalogControls();
        bindExerciseSidebarControls();
        bindPracticeSurfaceControls();
    }

    function bindCatalogControls() {
        const form = document.querySelector("[data-catalog-controls]");
        if (!form) {
            return;
        }

        form.addEventListener("submit", handleCatalogControlsSubmit);
        form.querySelector("[data-reset-query]")?.addEventListener("click", resetQueryControls);
    }

    function bindExerciseSidebarControls() {
        document.querySelectorAll("[data-exercise-sidebar-tab]").forEach((button) => {
            button.addEventListener("click", () => {
                const nextTab = button.dataset.exerciseSidebarTab;
                if (!nextTab || nextTab === state.exerciseSidebarTab) {
                    return;
                }

                state.exerciseSidebarTab = nextTab;
                render();
            });
        });
    }

    function bindPracticeSurfaceControls() {
        document.querySelectorAll("[data-practice-context-tab]").forEach((button) => {
            button.addEventListener("click", () => {
                const nextTab = button.dataset.practiceContextTab;
                if (!nextTab || nextTab === state.practiceContextTab) {
                    return;
                }

                state.practiceContextTab = nextTab;
                render();
            });
        });

        const form = document.querySelector("[data-practice-draft-form]");
        if (!form) {
            return;
        }

        form.addEventListener("input", handlePracticeDraftInput);
        form.addEventListener("submit", handlePracticeDraftSubmit);
        form.querySelector("[data-reset-practice-draft]")?.addEventListener("click", resetPracticeDraft);
    }

    function handlePracticeDraftInput(event) {
        const formData = new FormData(event.currentTarget);
        state.practiceDraft.answer = String(formData.get("answer") ?? "");
        state.practiceDraft.validationError = null;

        if (state.practiceDraft.preparedAnswer && state.practiceDraft.preparedAnswer !== state.practiceDraft.answer.trim()) {
            state.practiceDraft.preparedAnswer = null;
            state.practiceDraft.preparedAt = null;
        }
    }

    function handlePracticeDraftSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const answer = String(formData.get("answer") ?? "").trim();

        if (!answer) {
            state.practiceDraft.validationError = "Enter a Git command before preparing the practice payload.";
            render();
            return;
        }

        state.practiceDraft.answer = String(formData.get("answer") ?? "");
        state.practiceDraft.validationError = null;
        state.practiceDraft.preparedAnswer = answer;
        state.practiceDraft.preparedAt = new Date().toISOString();
        render();
    }

    function resetPracticeDraft() {
        state.practiceDraft = createInitialPracticeDraft();
        render();
    }

    async function reloadActiveRouteData() {
        await Promise.all([
            loadCatalog(),
            state.route === "exercise" ? loadScenarioDetail() : Promise.resolve()
        ]);
    }

    function resetRouteScopedState() {
        state.exerciseSidebarTab = "tasks";
        state.practiceContextTab = "branches";
        state.practiceDraft = createInitialPracticeDraft();

        if (state.route !== "exercise") {
            state.detail.status = "idle";
            state.detail.data = null;
            state.detail.error = null;
        }
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

function resolveSelectedCatalogScenario(state, catalogItems) {
    if (!state.selectedScenarioSlug) {
        return null;
    }

    return catalogItems.find((item) => item.slug === state.selectedScenarioSlug) ?? null;
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

function createInitialPracticeDraft() {
    return {
        answer: "",
        validationError: null,
        preparedAnswer: null,
        preparedAt: null
    };
}

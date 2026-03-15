import { renderCatalogWorkspace } from "./view.js";

const DEFAULT_PROVIDER_NAME = "local-fixture";
const NAVIGATION_TOGGLE_ANIMATION_MS = 240;
const DEFAULT_QUERY = Object.freeze({
    difficulty: null,
    tags: [],
    sort: null
});

export function createCatalogWorkspaceController({ appRoot, catalogProviderFactories, detailProviderFactories, tagOptions }) {
    const state = {
        route: "catalog",
        selectedScenarioSlug: null,
        selectedFocus: null,
        expandedScenarioSlugs: [],
        providerName: DEFAULT_PROVIDER_NAME,
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
        },
        detailCache: {
        }
    };

    let latestCatalogRequestId = 0;
    let latestDetailRequestId = 0;
    const detailLoadTasks = new Map();
    let navigationAnimationInProgress = false;

    async function bootstrap() {
        window.addEventListener("hashchange", handleRouteChange);
        window.addEventListener("resize", syncNavigationPaneWidth);

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
        state.selectedFocus = route.focus;
        if (route.name === "exercise" && route.scenarioSlug) {
            expandScenario(route.scenarioSlug, { loadDetail: false });
        }
        resetRouteScopedState();
        render();

        if (state.route === "not-found") {
            return;
        }

        await Promise.all([
            loadCatalog(),
            state.route === "exercise" ? loadScenarioDetail(state.selectedScenarioSlug, { syncSelected: true }) : Promise.resolve()
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

    async function loadScenarioDetail(slug = state.selectedScenarioSlug, { syncSelected = false } = {}) {
        if (!slug) {
            state.detail.status = "missing";
            state.detail.data = null;
            state.detail.error = "Scenario slug is missing from the exercise route.";
            render();
            return;
        }

        const requestId = syncSelected ? ++latestDetailRequestId : latestDetailRequestId;
        const providerName = state.providerName;
        const cachedDetail = state.detailCache[slug];

        if (cachedDetail?.status === "ready") {
            if (syncSelected) {
                state.detail.status = "ready";
                state.detail.data = cachedDetail.data;
                state.detail.error = null;
                render();
            }
            return;
        }

        if (syncSelected) {
            state.detail.status = "loading";
            state.detail.data = null;
            state.detail.error = null;
        }

        state.detailCache[slug] = {
            status: "loading",
            data: null,
            error: null
        };
        render();

        if (detailLoadTasks.has(slug)) {
            await detailLoadTasks.get(slug);
            syncSelectedDetailFromCache(slug, requestId, syncSelected);
            return;
        }

        try {
            const detailLoadTask = (async () => {
                const providerFactory = detailProviderFactories[providerName];
                if (!providerFactory) {
                    throw new Error(`Unknown scenario detail provider: ${providerName}`);
                }

                const provider = providerFactory();
                const detail = await provider.loadScenarioDetail(slug);
                state.detailCache[slug] = {
                    status: "ready",
                    data: detail,
                    error: null
                };
            })();

            detailLoadTasks.set(slug, detailLoadTask);
            await detailLoadTask;
        } catch (error) {
            state.detailCache[slug] = {
                status: "error",
                data: null,
                error: error instanceof Error ? error.message : "Unknown scenario detail error"
            };
        } finally {
            detailLoadTasks.delete(slug);
        }

        syncSelectedDetailFromCache(slug, requestId, syncSelected);
    }

    function render() {
        const selectedCatalogScenario = resolveSelectedCatalogScenario(state, state.catalog.items);
        const isExerciseRoute = state.route === "exercise";
        appRoot.classList.toggle("app-shell--exercise", isExerciseRoute);
        appRoot.innerHTML = renderCatalogWorkspace({
            state,
            selectedCatalogScenario,
            tagOptions
        });

        syncNavigationPaneWidth();
        bindNavigationControls();
        bindPracticeSurfaceControls();
    }

    function bindNavigationControls() {
        document.querySelectorAll("[data-scenario-toggle]").forEach((button) => {
            button.addEventListener("click", () => {
                const slug = button.dataset.scenarioToggle;
                if (!slug) {
                    return;
                }

                void toggleScenarioExpansion(slug);
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
        state.practiceContextTab = "branches";
        state.practiceDraft = createInitialPracticeDraft();

        if (state.route !== "exercise") {
            state.selectedFocus = null;
            state.detail.status = "idle";
            state.detail.data = null;
            state.detail.error = null;
        }
    }

    return {
        bootstrap
    };

    function syncNavigationPaneWidth() {
        const lessonLayout = appRoot.querySelector(".lesson-layout");
        const navigationLane = appRoot.querySelector(".lesson-lane--navigation");
        if (!lessonLayout || !navigationLane || window.innerWidth <= 900) {
            lessonLayout?.style.removeProperty("--navigation-pane-width");
            return;
        }

        const flowBlocks = [...navigationLane.querySelectorAll(".flow-block")];
        if (!flowBlocks.length) {
            lessonLayout.style.removeProperty("--navigation-pane-width");
            return;
        }

        const maxContentWidth = measureNaturalNavigationWidth(navigationLane);
        const maxWidth = Math.ceil(maxContentWidth + 36);
        const minWidth = Math.ceil(maxWidth / 2);
        const preferredWidth = Math.round(window.innerWidth * 0.24);
        const targetWidth = Math.min(maxWidth, Math.max(minWidth, preferredWidth));

        lessonLayout.style.setProperty("--navigation-pane-width", `${targetWidth}px`);
    }

    function expandScenario(slug, { loadDetail = true } = {}) {
        if (!slug || state.expandedScenarioSlugs.includes(slug)) {
            return;
        }

        state.expandedScenarioSlugs = [...state.expandedScenarioSlugs, slug];
        if (loadDetail) {
            void loadScenarioDetail(slug, { syncSelected: false });
        }
    }

    function collapseScenario(slug) {
        state.expandedScenarioSlugs = state.expandedScenarioSlugs.filter((item) => item !== slug);
    }

    function syncSelectedDetailFromCache(slug, requestId, syncSelected) {
        if (!syncSelected || requestId !== latestDetailRequestId || slug !== state.selectedScenarioSlug) {
            render();
            return;
        }

        const cachedDetail = state.detailCache[slug];
        if (!cachedDetail) {
            state.detail.status = "error";
            state.detail.data = null;
            state.detail.error = "Unknown scenario detail error";
            render();
            return;
        }

        state.detail.status = cachedDetail.status;
        state.detail.data = cachedDetail.data;
        state.detail.error = cachedDetail.error;
        render();
    }

    async function toggleScenarioExpansion(slug) {
        if (navigationAnimationInProgress) {
            return;
        }

        navigationAnimationInProgress = true;

        try {
            if (state.expandedScenarioSlugs.includes(slug)) {
                await animateScenarioCollapse(slug);
                collapseScenario(slug);
                render();
                return;
            }

            expandScenario(slug, { loadDetail: false });
            render();
            await animateScenarioExpansion(slug);
            await loadScenarioDetail(slug, { syncSelected: false });
        } finally {
            navigationAnimationInProgress = false;
        }
    }

    function animateScenarioExpansion(slug) {
        const panel = findScenarioPanel(slug);
        if (!panel || prefersReducedMotion()) {
            return Promise.resolve();
        }

        panel.style.height = "0px";
        panel.style.opacity = "0";
        panel.style.overflow = "hidden";

        const targetHeight = panel.scrollHeight;
        panel.getBoundingClientRect();

        panel.style.transition = createScenarioPanelTransition();
        panel.style.height = `${targetHeight}px`;
        panel.style.opacity = "1";

        return waitForScenarioAnimation(panel, () => {
            panel.style.removeProperty("height");
            panel.style.removeProperty("opacity");
            panel.style.removeProperty("overflow");
            panel.style.removeProperty("transition");
        });
    }

    function animateScenarioCollapse(slug) {
        const panel = findScenarioPanel(slug);
        if (!panel || prefersReducedMotion()) {
            return Promise.resolve();
        }

        panel.style.height = `${panel.getBoundingClientRect().height}px`;
        panel.style.opacity = "1";
        panel.style.overflow = "hidden";
        panel.getBoundingClientRect();

        panel.style.transition = createScenarioPanelTransition();
        panel.style.height = "0px";
        panel.style.opacity = "0";

        return waitForScenarioAnimation(panel, () => {
            panel.style.removeProperty("transition");
        });
    }

    function findScenarioPanel(slug) {
        return appRoot.querySelector(`[data-scenario-panel="${escapeSelectorValue(slug)}"]`);
    }

    function createScenarioPanelTransition() {
        return [
            `height ${NAVIGATION_TOGGLE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            `opacity ${Math.round(NAVIGATION_TOGGLE_ANIMATION_MS * 0.7)}ms ease`
        ].join(", ");
    }

    function waitForScenarioAnimation(panel, cleanup) {
        return new Promise((resolve) => {
            let settled = false;

            const finalize = () => {
                if (settled) {
                    return;
                }

                settled = true;
                panel.removeEventListener("transitionend", handleTransitionEnd);
                window.clearTimeout(timeoutId);
                cleanup();
                resolve();
            };

            const handleTransitionEnd = (event) => {
                if (event.target === panel && event.propertyName === "height") {
                    finalize();
                }
            };

            const timeoutId = window.setTimeout(finalize, NAVIGATION_TOGGLE_ANIMATION_MS + 120);
            panel.addEventListener("transitionend", handleTransitionEnd);
        });
    }

    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
}

function parseRoute(hash) {
    if (hash === "#/catalog") {
        return {
            name: "catalog",
            scenarioSlug: null,
            focus: null
        };
    }

    const exerciseMatch = hash.match(/^#\/exercise\/([^?#]+)(?:\?([^#]+))?$/);
    if (exerciseMatch) {
        const query = new URLSearchParams(exerciseMatch[2] ?? "");
        return {
            name: "exercise",
            scenarioSlug: decodeURIComponent(exerciseMatch[1]),
            focus: normalizeOptionalValue(query.get("focus"))
        };
    }

    return {
        name: "not-found",
        scenarioSlug: null,
        focus: null
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

function measureNaturalNavigationWidth(navigationLane) {
    const scrollContent = navigationLane.querySelector(".lesson-lane__scroll-content");
    if (!scrollContent) {
        return navigationLane.scrollWidth;
    }

    const measureRoot = document.createElement("div");
    measureRoot.style.position = "fixed";
    measureRoot.style.left = "-10000px";
    measureRoot.style.top = "0";
    measureRoot.style.visibility = "hidden";
    measureRoot.style.pointerEvents = "none";
    measureRoot.style.width = "max-content";
    measureRoot.style.maxWidth = "none";
    measureRoot.style.minWidth = "0";

    const clone = scrollContent.cloneNode(true);
    clone.style.width = "max-content";
    clone.style.minWidth = "max-content";
    clone.style.maxWidth = "none";
    clone.style.paddingLeft = "18px";
    clone.style.paddingRight = "18px";

    measureRoot.append(clone);
    document.body.append(measureRoot);

    const width = clone.getBoundingClientRect().width;
    measureRoot.remove();

    return width;
}

function escapeSelectorValue(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
        return CSS.escape(value);
    }

    return value.replace(/"/g, '\\"');
}

export function createWorkspaceDataOrchestrator({
    state,
    render,
    catalogProviderFactories,
    detailProviderFactories,
    progressProviderFactories,
    cloneQuery,
    toUserFacingRecoveryMessage,
    isEmptyProgressSummary,
    createInitialSubmissionDraftState,
    createInitialSessionState,
    createInitialProgressState,
    ensureExerciseSession,
    invalidateSessionRequests
}) {
    let latestCatalogRequestId = 0;
    let latestDetailRequestId = 0;
    let latestProgressRequestId = 0;
    const detailLoadTasks = new Map();
    const progressProviders = new Map();

    function ensureCatalogLoaded() {
        if (state.catalog.status !== "idle") {
            return Promise.resolve();
        }

        return loadCatalog();
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
                throw new Error(`Неизвестный источник каталога: ${providerName}`);
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
            state.catalog.error = toUserFacingRecoveryMessage(
                error instanceof Error ? error.message : null,
                "Источник каталога сейчас недоступен. Повторите чуть позже."
            );
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
            state.detail.error = "В маршруте упражнения не указан код сценария.";
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

        if (syncSelected) {
            render();
        }

        if (detailLoadTasks.has(slug)) {
            await detailLoadTasks.get(slug);
            syncSelectedDetailFromCache(slug, requestId, syncSelected);
            return;
        }

        try {
            const detailLoadTask = (async () => {
                const providerFactory = detailProviderFactories[providerName];
                if (!providerFactory) {
                    throw new Error(`Неизвестный источник деталей сценария: ${providerName}`);
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
                error: toUserFacingRecoveryMessage(
                    error instanceof Error ? error.message : null,
                    "Источник деталей сценария сейчас недоступен. Повторите чуть позже."
                )
            };
        } finally {
            detailLoadTasks.delete(slug);
        }

        syncSelectedDetailFromCache(slug, requestId, syncSelected);
    }

    async function loadProgressSummary() {
        if (state.route !== "progress") {
            return;
        }

        const requestId = ++latestProgressRequestId;
        state.progress.status = "loading";
        state.progress.summary = null;
        state.progress.error = null;
        render();

        try {
            const provider = resolveProgressProvider(state.providerName);
            const summary = await provider.loadProgressSummary();
            if (requestId !== latestProgressRequestId || state.route !== "progress") {
                return;
            }

            state.progress.summary = summary;
            state.progress.error = null;
            state.progress.status = isEmptyProgressSummary(summary) ? "empty" : "ready";
        } catch (error) {
            if (requestId !== latestProgressRequestId || state.route !== "progress") {
                return;
            }

            state.progress.summary = null;
            state.progress.error = toUserFacingRecoveryMessage(
                error instanceof Error ? error.message : null,
                "Сводка прогресса сейчас недоступна. Повторите чуть позже."
            );
            state.progress.status = "error";
        }

        if (requestId !== latestProgressRequestId || state.route !== "progress") {
            return;
        }

        render();
    }

    async function reloadActiveRouteData() {
        await Promise.all([
            loadCatalog(),
            state.route === "progress" ? loadProgressSummary() : Promise.resolve(),
            state.route === "exercise" ? loadScenarioDetail() : Promise.resolve(),
            state.route === "exercise" ? ensureExerciseSession({ force: true }) : Promise.resolve()
        ]);
    }

    function resetProviderScopedState() {
        state.detail.status = state.route === "exercise" ? "loading" : "idle";
        state.detail.data = null;
        state.detail.error = null;
        state.detailCache = {};
        state.submissionDraft = createInitialSubmissionDraftState();
        state.session = createInitialSessionState();
        state.progress = createInitialProgressState();
        progressProviders.clear();
        ++latestDetailRequestId;
        invalidateSessionRequests();
        ++latestProgressRequestId;
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
            state.detail.error = "Неизвестная ошибка деталей сценария";
            render();
            return;
        }

        state.detail.status = cachedDetail.status;
        state.detail.data = cachedDetail.data;
        state.detail.error = cachedDetail.error;
        render();
    }

    function resolveProgressProvider(providerName) {
        if (progressProviders.has(providerName)) {
            return progressProviders.get(providerName);
        }

        const providerFactory = progressProviderFactories[providerName];
        if (!providerFactory) {
            throw new Error(`Неизвестный источник данных прогресса: ${providerName}`);
        }

        const provider = providerFactory();
        progressProviders.set(providerName, provider);
        return provider;
    }

    return {
        ensureCatalogLoaded,
        loadCatalog,
        loadScenarioDetail,
        loadProgressSummary,
        reloadActiveRouteData,
        resetProviderScopedState
    };
}

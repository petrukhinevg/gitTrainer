export function resolveIntroTitle(state) {
    if (state.route !== "exercise") {
        return "Catalog browsing and route handoff now share one shell";
    }

    if (state.detail.status === "ready") {
        return state.detail.data.title;
    }

    if (state.detail.status === "error") {
        return "Exercise route keeps a stable error boundary";
    }

    return "Exercise route is loading provider-backed detail";
}

export function resolveIntroDescription(state) {
    if (state.route !== "exercise") {
        return "The catalog still owns selection and provider state, but the learner no longer bounces between separate UI shells before entering the exercise flow.";
    }

    if (state.detail.status === "ready") {
        return "The learner has already left the catalog and landed in the same standalone workspace shell with a route-specific detail payload.";
    }

    if (state.detail.status === "error") {
        return "The route is preserved and the workspace shell stays mounted even when scenario detail loading fails.";
    }

    return "The exercise route now loads through a dedicated provider seam, with explicit loading flow before deeper task and repository content is implemented.";
}

export function resolveDetailStatusLabel(state) {
    return state.route === "exercise" ? state.detail.status : "inactive";
}

export function resolveLeftPanelTitle(state) {
    if (state.route === "exercise" && state.detail.status === "ready") {
        return state.detail.data.workspace.shell.leftPanelTitle;
    }

    return "Scenario map";
}

export function describeCatalogStatus(state) {
    switch (state.catalog.status) {
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
                description: state.catalog.error ?? "The active provider failed before returning scenario summaries."
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

export function renderProviderOption(state, value, label) {
    return `<option value="${value}" ${state.providerName === value ? "selected" : ""}>${label}</option>`;
}

export function renderDifficultyOption(state, value, label) {
    return `<option value="${value ?? ""}" ${state.query.difficulty === value ? "selected" : ""}>${label}</option>`;
}

export function renderSortOption(state, value, label) {
    const selectedSort = state.query.sort ?? "title";
    return `<option value="${value}" ${selectedSort === value ? "selected" : ""}>${label}</option>`;
}

export function resolveTaskInstructions(detail) {
    return (detail.workspace.task.instructions ?? []).map((instruction, index) => {
        if (typeof instruction === "string") {
            return {
                id: `instruction-${index + 1}`,
                text: instruction
            };
        }

        return {
            id: instruction.id ?? `instruction-${index + 1}`,
            text: instruction.text ?? ""
        };
    });
}

export function resolveTaskSteps(detail) {
    return (detail.workspace.task.steps ?? [])
        .map((step, index) => {
            if (typeof step === "string") {
                return {
                    position: index + 1,
                    title: `Step ${index + 1}`,
                    detail: step
                };
            }

            return {
                position: step.position ?? index + 1,
                title: step.title ?? `Step ${index + 1}`,
                detail: step.detail ?? ""
            };
        })
        .sort((left, right) => left.position - right.position);
}

export function resolveTaskAnnotations(detail) {
    return (detail.workspace.task.annotations ?? []).map((annotation, index) => {
        if (typeof annotation === "string") {
            return {
                label: `Note ${index + 1}`,
                message: annotation
            };
        }

        return {
            label: annotation.label ?? `Note ${index + 1}`,
            message: annotation.message ?? ""
        };
    });
}

export function normalizeRepositoryContext(repositoryContext) {
    const safeContext = repositoryContext ?? {};
    return {
        status: typeof safeContext.status === "string" && safeContext.status.trim() !== ""
            ? safeContext.status
            : "unavailable",
        branches: Array.isArray(safeContext.branches) ? safeContext.branches : [],
        commits: Array.isArray(safeContext.commits) ? safeContext.commits : [],
        files: Array.isArray(safeContext.files) ? safeContext.files : [],
        annotations: Array.isArray(safeContext.annotations) ? safeContext.annotations : []
    };
}

export function renderEmptyContextState(message) {
    return `
        <article class="context-row context-row--annotation">
            <span class="control-label">Empty state</span>
            <p class="panel-copy">${escapeHtml(message)}</p>
        </article>
    `;
}

export function formatDifficulty(value) {
    if (!value) {
        return "Unknown";
    }

    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

export function encodeHashSegment(value) {
    return encodeURIComponent(String(value));
}

export function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

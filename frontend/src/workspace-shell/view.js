export function renderCatalogWorkspace({ state, selectedCatalogScenario, tagOptions }) {
    if (state.route === "not-found") {
        return `
            <section class="workspace-intro panel">
                <p class="panel-label">Route shell</p>
                <h2>Unknown route</h2>
                <p>The standalone frontend keeps learner navigation inside one shell, but only <code>#/catalog</code> and <code>#/exercise/&lt;slug&gt;</code> are wired right now.</p>
            </section>
        `;
    }

    return `
        <section class="workspace-intro panel">
            <div class="workspace-intro__copy">
                <p class="panel-label">Standalone frontend</p>
                <h2>${escapeHtml(resolveIntroTitle(state))}</h2>
                <p>${escapeHtml(resolveIntroDescription(state))}</p>
            </div>
            <div class="workspace-intro__meta">
                <div class="workspace-chip">Route: ${escapeHtml(state.route)}</div>
                <div class="workspace-chip">Provider: ${escapeHtml(state.providerName)}</div>
                <div class="workspace-chip">Catalog: ${escapeHtml(state.catalog.status)}</div>
                <div class="workspace-chip">Detail: ${escapeHtml(resolveDetailStatusLabel(state))}</div>
                <div class="workspace-chip">Draft: ${escapeHtml(resolveDraftStatusLabel(state))}</div>
            </div>
        </section>

        <section class="workspace-grid">
            ${renderSidebar(state, selectedCatalogScenario, tagOptions)}
            ${renderMainPanel(state)}
            ${renderWorkspacePanel(state)}
        </section>
    `;
}

function renderSidebar(state, selectedCatalogScenario, tagOptions) {
    return `
        <aside class="panel panel--sidebar">
            <p class="panel-label">${escapeHtml(resolveLeftPanelTitle(state))}</p>
            <h3>Browse controls and route entry</h3>
            <p class="panel-copy">
                The catalog and exercise detail providers are now separate seams. Query controls still shape browsing, while the exercise route loads scenario detail by slug through its own boundary.
            </p>
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
        </aside>
    `;
}

function renderMainPanel(state) {
    if (state.route === "exercise") {
        return renderExerciseMainPanel(state);
    }

    return `
        <section class="panel panel--lesson">
            <p class="panel-label">Catalog overview</p>
            <h3>Choose a scenario before opening the workspace</h3>
            <p class="panel-copy">${escapeHtml(describeCatalogStatus(state).description)}</p>
            ${renderCatalogOverviewState(state)}
        </section>
    `;
}

function renderExerciseMainPanel(state) {
    const detail = state.detail.data;

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return `
            <section class="panel panel--lesson">
                <p class="panel-label">Workspace lesson</p>
                <h3>Loading workspace detail</h3>
                <p class="panel-copy">
                    The route is already stable. This shell is waiting for the active detail provider to resolve the selected scenario by slug.
                </p>
            </section>
        `;
    }

    if (state.detail.status === "error") {
        return `
            <section class="panel panel--lesson">
                <p class="panel-label">Workspace lesson</p>
                <h3>Exercise detail is unavailable</h3>
                <p class="panel-copy">
                    The exercise route now has explicit load and error flow handling. The shell stays in place, but the selected scenario detail provider failed before returning a payload.
                </p>
                <div class="lesson-block">
                    <h4 class="lesson-block__title">Requested route</h4>
                    <dl class="result-summary">
                        <div>
                            <dt>Scenario slug</dt>
                            <dd>${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</dd>
                        </div>
                        <div>
                            <dt>Provider</dt>
                            <dd>${escapeHtml(state.providerName)}</dd>
                        </div>
                        <div>
                            <dt>Error</dt>
                            <dd>${escapeHtml(state.detail.error ?? "Unknown scenario detail error")}</dd>
                        </div>
                    </dl>
                </div>
            </section>
        `;
    }

    return `
        <section class="panel panel--lesson">
            <p class="panel-label">${escapeHtml(detail.workspace.shell.centerPanelTitle)}</p>
            <h3>${escapeHtml(detail.title)}</h3>
            <p class="panel-copy">${escapeHtml(detail.summary)}</p>
            <div class="lesson-block">
                <h4 class="lesson-block__title">Task placeholder</h4>
                <p class="panel-copy">${escapeHtml(detail.workspace.task.goal)}</p>
                <dl class="result-summary">
                    <div>
                        <dt>Task status</dt>
                        <dd>${escapeHtml(detail.workspace.task.status)}</dd>
                    </div>
                    <div>
                        <dt>Instructions</dt>
                        <dd>${detail.workspace.task.instructions.length}</dd>
                    </div>
                    <div>
                        <dt>Steps</dt>
                        <dd>${detail.workspace.task.steps.length}</dd>
                    </div>
                </dl>
            </div>
            <div class="lesson-block">
                <h4 class="lesson-block__title">Provider seam</h4>
                <p class="panel-copy">
                    This panel now renders from the scenario detail payload instead of the catalog summary route placeholder. Final task instructions and repository visuals still belong to later slices.
                </p>
                <dl class="result-summary">
                    <div>
                        <dt>Detail source</dt>
                        <dd>${escapeHtml(detail.meta.source)}</dd>
                    </div>
                    <div>
                        <dt>Stub payload</dt>
                        <dd>${escapeHtml(String(detail.meta.stub))}</dd>
                    </div>
                    <div>
                        <dt>Difficulty</dt>
                        <dd>${escapeHtml(detail.difficulty)}</dd>
                    </div>
                </dl>
            </div>
        </section>
    `;
}

function renderWorkspacePanel(state) {
    if (state.route !== "exercise") {
        return `
            <section class="panel panel--workspace">
                <p class="panel-label">Workspace lane</p>
                <h3>Exercise shell waits behind the chosen route</h3>
                <p class="panel-copy">
                    The route shell is already reserved. Pick a scenario from the catalog to load detail through the dedicated provider seam.
                </p>
                <div class="workspace-card">
                    <div class="workspace-card__header">
                        <span class="control-label">Detail boundary</span>
                        <span class="workspace-card__badge">catalog mode</span>
                    </div>
                    <p class="panel-copy">No exercise detail request is active while the learner remains on the catalog route.</p>
                    <div class="workspace-card__actions">
                        <span class="scenario-link">Select a scenario to reserve the route handoff.</span>
                    </div>
                </div>
            </section>
        `;
    }

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return `
            <section class="panel panel--workspace">
                <p class="panel-label">Workspace lane</p>
                <h3>Selected scenario detail is loading</h3>
                <p class="panel-copy">
                    The right lane stays stable while the provider resolves the workspace payload. This is the top-level load flow for the exercise route.
                </p>
                <div class="workspace-card">
                    <div class="workspace-card__header">
                        <span class="control-label">Detail provider</span>
                        <span class="workspace-card__badge">loading</span>
                    </div>
                    <p class="panel-copy">Requested slug: ${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</p>
                </div>
            </section>
        `;
    }

    if (state.detail.status === "error") {
        return `
            <section class="panel panel--workspace">
                <p class="panel-label">Workspace lane</p>
                <h3>Scenario detail provider seam failed</h3>
                <p class="panel-copy">
                    The shell keeps a coherent error state when the active detail provider cannot load the requested scenario.
                </p>
                <div class="workspace-card">
                    <div class="workspace-card__header">
                        <span class="control-label">Detail provider</span>
                        <span class="workspace-card__badge">error</span>
                    </div>
                    <p class="panel-copy">${escapeHtml(state.detail.error ?? "Unknown scenario detail error")}</p>
                    <div class="workspace-card__actions">
                        <a class="scenario-action scenario-action--muted" href="#/catalog">Back to catalog</a>
                    </div>
                </div>
            </section>
        `;
    }

    const detail = state.detail.data;
    return `
        <section class="panel panel--workspace">
            <p class="panel-label">${escapeHtml(detail.workspace.shell.rightPanelTitle)}</p>
            <h3>Answer input shell is local-first and submission-ready</h3>
            <p class="panel-copy">
                The workspace now keeps answer controls and draft-state semantics in the right lane, but submission transport still stays local until the next session integration slice.
            </p>
            <form class="answer-form workspace-card" data-answer-form>
                <div class="workspace-card__header">
                    <span class="control-label">Answer input shell</span>
                    <span class="workspace-card__badge">${escapeHtml(resolveDraftStatusLabel(state))}</span>
                </div>
                <label class="answer-form__field">
                    <span class="control-label">Draft answer</span>
                    <textarea
                        name="answer"
                        rows="8"
                        data-answer-input
                        placeholder="git status&#10;git branch -vv"
                    >${escapeHtml(state.answerDraft.value)}</textarea>
                </label>
                <p class="panel-copy">
                    Type a command sequence or free-form answer, validate it locally, and keep it staged inside the workspace before live transport is wired.
                </p>
                ${renderDraftFeedback(state)}
                <div class="answer-form__actions">
                    <button type="submit" ${canSubmitDraft(state) ? "" : "disabled"}>Submit local draft</button>
                    <button type="reset" class="answer-form__secondary" ${canResetDraft(state) ? "" : "disabled"}>Reset draft</button>
                    <a class="scenario-action scenario-action--muted" href="#/catalog">Back to catalog</a>
                </div>
            </form>
            <div class="workspace-card">
                <div class="workspace-card__header">
                    <span class="control-label">Repository context seam</span>
                    <span class="workspace-card__badge">${escapeHtml(detail.workspace.repositoryContext.status)}</span>
                </div>
                <p class="panel-copy">
                    The exercise shell still exposes static repository placeholders. Answer drafting now lives beside them without depending on final correctness or transport feedback.
                </p>
                <dl class="result-summary">
                    <div>
                        <dt>Branches</dt>
                        <dd>${detail.workspace.repositoryContext.branches.length}</dd>
                    </div>
                    <div>
                        <dt>Commits</dt>
                        <dd>${detail.workspace.repositoryContext.commits.length}</dd>
                    </div>
                    <div>
                        <dt>Files</dt>
                        <dd>${detail.workspace.repositoryContext.files.length}</dd>
                    </div>
                    <div>
                        <dt>Annotations</dt>
                        <dd>${detail.workspace.repositoryContext.annotations.length}</dd>
                    </div>
                </dl>
            </div>
            ${renderDraftPreview(state)}
        </section>
    `;
}

function renderDraftFeedback(state) {
    if (state.answerDraft.error) {
        return `<p class="answer-form__feedback answer-form__feedback--error">${escapeHtml(state.answerDraft.error)}</p>`;
    }

    if (state.answerDraft.status === "ready") {
        return `
            <p class="answer-form__feedback">
                Draft is ready for session transport. The submit action currently stages local state only, so the learner can review the answer before backend transport is wired.
            </p>
        `;
    }

    return `
        <p class="answer-form__feedback">
            Submit-ready behavior stays local in this slice: empty drafts are blocked, valid drafts can be staged, and reset clears the workspace answer state.
        </p>
    `;
}

function renderDraftPreview(state) {
    const preview = state.answerDraft.lastSubmittedPreview;
    if (!preview) {
        return "";
    }

    return `
        <div class="workspace-card workspace-card--draft">
            <div class="workspace-card__header">
                <span class="control-label">Local submission preview</span>
                <span class="workspace-card__badge">staged</span>
            </div>
            <p class="panel-copy">
                Draft is ready for session transport once the live session bootstrap and submission request flow are integrated.
            </p>
            <pre class="draft-preview"><code>${escapeHtml(preview.value)}</code></pre>
            <dl class="result-summary">
                <div>
                    <dt>Characters</dt>
                    <dd>${preview.characterCount}</dd>
                </div>
                <div>
                    <dt>Lines</dt>
                    <dd>${preview.lineCount}</dd>
                </div>
            </dl>
        </div>
    `;
}

function renderCatalogOverviewState(state) {
    switch (state.catalog.status) {
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
                    <p>${escapeHtml(state.catalog.error ?? "The selected catalog source failed before returning items.")}</p>
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
                    <h4>No scenario selected yet</h4>
                    <p class="panel-copy">Choose a scenario from the map or card list to drive the workspace handoff intentionally.</p>
                </div>
                <div class="scenario-list">
                    ${state.catalog.items.map(renderScenarioCard).join("")}
                </div>
            `;
    }
}

function renderScenarioRail(state, selectedCatalogScenario) {
    switch (state.catalog.status) {
        case "loading":
            return `<p class="panel-copy">Loading scenario links for the shared workspace shell.</p>`;
        case "error":
            return `<p class="panel-copy">${escapeHtml(state.catalog.error ?? "Catalog source is unavailable.")}</p>`;
        case "empty":
            return `<p class="panel-copy">No scenarios match the current query.</p>`;
        default:
            return `
                <div class="scenario-rail__list">
                    ${state.catalog.items.map((item) => renderScenarioRailLink(item, selectedCatalogScenario)).join("")}
                </div>
            `;
    }
}

function renderScenarioRailLink(item, selectedCatalogScenario) {
    const isActive = item.slug === selectedCatalogScenario?.slug;
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
                <span class="entry-note">Route handoff now resolves detail through a dedicated provider seam.</span>
            </div>
        </article>
    `;
}

function resolveIntroTitle(state) {
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

function resolveIntroDescription(state) {
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

function resolveDetailStatusLabel(state) {
    return state.route === "exercise" ? state.detail.status : "inactive";
}

function resolveDraftStatusLabel(state) {
    if (state.route !== "exercise") {
        return "inactive";
    }

    return state.answerDraft.status;
}

function resolveLeftPanelTitle(state) {
    if (state.route === "exercise" && state.detail.status === "ready") {
        return state.detail.data.workspace.shell.leftPanelTitle;
    }

    return "Scenario map";
}

function describeCatalogStatus(state) {
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

function canSubmitDraft(state) {
    return state.route === "exercise" && state.detail.status === "ready" && Boolean(state.answerDraft.value.trim());
}

function canResetDraft(state) {
    return Boolean(state.answerDraft.value) || Boolean(state.answerDraft.lastSubmittedPreview);
}

function formatDifficulty(value) {
    if (!value) {
        return "Unknown";
    }

    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
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

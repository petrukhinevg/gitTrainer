export function renderCatalogWorkspace({ state, catalogItems, selectedScenario, selectedScenarioState, tagOptions }) {
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
                <h2>${escapeHtml(resolveIntroTitle(state, selectedScenario, selectedScenarioState))}</h2>
                <p>${escapeHtml(resolveIntroDescription(state, selectedScenario, selectedScenarioState))}</p>
            </div>
            <div class="workspace-intro__meta">
                <div class="workspace-chip">Route: ${escapeHtml(state.route)}</div>
                <div class="workspace-chip">Provider: ${escapeHtml(state.providerName)}</div>
                <div class="workspace-chip">Status: ${escapeHtml(state.status)}</div>
            </div>
        </section>

        <section class="workspace-grid">
            ${renderSidebar(state, catalogItems, selectedScenario, tagOptions)}
            ${renderMainPanel(state, catalogItems, selectedScenario, selectedScenarioState)}
            ${renderWorkspacePanel(state, selectedScenario, selectedScenarioState)}
        </section>
    `;
}

function renderSidebar(state, catalogItems, selectedScenario, tagOptions) {
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
                    <button type="submit">Reload catalog</button>
                    <button type="button" data-reset-query>Reset</button>
                </div>
            </form>

            <div class="scenario-rail">
                <div class="scenario-rail__header">
                    <span class="control-label">Scenario quick links</span>
                    <strong>${catalogItems.length}</strong>
                </div>
                ${renderScenarioRail(state, catalogItems, selectedScenario)}
            </div>
        </aside>
    `;
}

function renderMainPanel(state, catalogItems, selectedScenario, selectedScenarioState) {
    if (state.route === "exercise") {
        return renderExerciseMainPanel(state, selectedScenario, selectedScenarioState);
    }

    return `
        <section class="panel panel--lesson">
            <p class="panel-label">Catalog overview</p>
            <h3>Choose a scenario before opening the workspace</h3>
            <p class="panel-copy">${escapeHtml(describeStatus(state).description)}</p>
            ${renderCatalogOverviewState(state, catalogItems)}
        </section>
    `;
}

function renderExerciseMainPanel(state, selectedScenario, selectedScenarioState) {
    if (selectedScenarioState === "loading") {
        return `
            <section class="panel panel--lesson">
                <p class="panel-label">Workspace lesson</p>
                <h3>Loading selected scenario</h3>
                <p class="panel-copy">
                    The shell already moved into the exercise route. Provider data is still resolving the selected scenario before the workspace handoff can be confirmed.
                </p>
            </section>
        `;
    }

    if (selectedScenarioState !== "available") {
        return `
            <section class="panel panel--lesson">
                <p class="panel-label">Workspace lesson</p>
                <h3>Selected scenario is unavailable</h3>
                <p class="panel-copy">
                    The current provider result does not contain the requested slug, so the app keeps the handoff honest instead of silently filling the workspace with local fallback content.
                </p>
                <div class="lesson-block">
                    <h4 class="lesson-block__title">Requested route</h4>
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
                            <dt>Reason</dt>
                            <dd>${escapeHtml(resolveUnavailableReason(state, selectedScenarioState))}</dd>
                        </div>
                    </dl>
                </div>
                <div class="lesson-block">
                    <h4 class="lesson-block__title">Next step</h4>
                    <p class="panel-copy">
                        Go back to the catalog, adjust the current provider or filters, and select a scenario that is actually present in the active result set.
                    </p>
                </div>
            </section>
        `;
    }

    return `
        <section class="panel panel--lesson">
            <p class="panel-label">Workspace lesson</p>
            <h3>${escapeHtml(selectedScenario.title)}</h3>
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

function renderWorkspacePanel(state, selectedScenario, selectedScenarioState) {
    const primaryAction = resolvePrimaryAction(state, selectedScenario, selectedScenarioState);
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
                    <span class="workspace-card__badge">${escapeHtml(resolveWorkspaceBadge(state, selectedScenarioState))}</span>
                </div>
                <p class="panel-copy">${escapeHtml(resolveWorkspaceCopy(state, selectedScenario, selectedScenarioState))}</p>
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

function renderCatalogOverviewState(state, catalogItems) {
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
                    <h4>No scenario selected yet</h4>
                    <p class="panel-copy">Choose a scenario from the map or card list to drive the workspace handoff intentionally.</p>
                </div>
                <div class="scenario-list">
                    ${catalogItems.map(renderScenarioCard).join("")}
                </div>
            `;
    }
}

function renderScenarioRail(state, catalogItems, selectedScenario) {
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

function resolveIntroTitle(state, selectedScenario, selectedScenarioState) {
    if (state.route === "exercise" && selectedScenarioState === "available") {
        return selectedScenario.title;
    }

    if (state.route === "exercise") {
        return "Selected scenario is not available in the active provider";
    }

    return "Catalog browsing and route handoff now share one shell";
}

function resolveIntroDescription(state, selectedScenario, selectedScenarioState) {
    if (state.route === "exercise" && selectedScenarioState === "available") {
        return `The learner has already left the catalog and landed in the same standalone workspace shell for ${selectedScenario.title}.`;
    }

    if (state.route === "exercise") {
        return "The route is preserved, but the shell refuses to invent missing scenario detail when the active provider result does not contain the requested slug.";
    }

    return "The catalog still owns selection and provider state, but the learner no longer bounces between separate UI shells before entering the exercise flow.";
}

function resolveWorkspaceBadge(state, selectedScenarioState) {
    if (state.route !== "exercise") {
        return "catalog preview";
    }

    if (selectedScenarioState === "available") {
        return "active route";
    }

    return "route unavailable";
}

function resolveWorkspaceCopy(state, selectedScenario, selectedScenarioState) {
    if (state.route !== "exercise") {
        return "Choose any scenario from the map to drive the next exercise route.";
    }

    if (selectedScenarioState === "available") {
        return `Scenario "${selectedScenario.title}" is the current handoff target.`;
    }

    return "The requested route is present, but the active provider has not resolved a matching scenario for this shell.";
}

function resolvePrimaryAction(state, selectedScenario, selectedScenarioState) {
    if (state.route === "exercise" && selectedScenarioState === "available") {
        return `<a class="scenario-action" href="#/exercise/${encodeHashSegment(selectedScenario.slug)}">Open scenario</a>`;
    }

    if (state.route === "catalog") {
        return `<a class="scenario-action scenario-action--muted" href="#/catalog">Browse catalog</a>`;
    }

    return `<a class="scenario-action scenario-action--muted" href="#/catalog">Return to catalog</a>`;
}

function resolveUnavailableReason(state, selectedScenarioState) {
    if (selectedScenarioState === "unavailable") {
        return state.error ?? "Active provider failed before returning any scenario summaries.";
    }

    return "The active provider result does not include the requested slug under the current filters.";
}

function describeStatus(state) {
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

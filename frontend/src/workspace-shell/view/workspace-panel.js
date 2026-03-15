import {
    escapeHtml,
    normalizeRepositoryContext,
    renderEmptyContextState
} from "./render-helpers.js";

export function renderWorkspacePanel(state) {
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
    const repositoryContext = normalizeRepositoryContext(detail.workspace?.repositoryContext);
    return `
        <section class="panel panel--workspace">
            <p class="panel-label">${escapeHtml(detail.workspace.shell.rightPanelTitle)}</p>
            <h3>Repository context now has visible workspace surfaces</h3>
            <p class="panel-copy">
                The workspace now shows authored repository cues directly from the detail payload, while keeping the overall shell and route structure unchanged.
            </p>
            <div class="workspace-card">
                <div class="workspace-card__header">
                    <span class="control-label">Repository context seam</span>
                    <span class="workspace-card__badge">${escapeHtml(repositoryContext.status)}</span>
                </div>
                <p class="panel-copy">
                    Branch, commit, file, and annotation cues now render as first-class surfaces in the right lane instead of staying hidden behind aggregate counts.
                </p>
                <dl class="result-summary">
                    <div>
                        <dt>Branches</dt>
                        <dd>${repositoryContext.branches.length}</dd>
                    </div>
                    <div>
                        <dt>Commits</dt>
                        <dd>${repositoryContext.commits.length}</dd>
                    </div>
                    <div>
                        <dt>Files</dt>
                        <dd>${repositoryContext.files.length}</dd>
                    </div>
                    <div>
                        <dt>Annotations</dt>
                        <dd>${repositoryContext.annotations.length}</dd>
                    </div>
                </dl>
            </div>
            <div class="workspace-card">
                <div class="workspace-card__header">
                    <span class="control-label">Branches</span>
                    <span class="workspace-card__badge">${repositoryContext.branches.length}</span>
                </div>
                <div class="context-list">
                    ${repositoryContext.branches.length > 0 ? repositoryContext.branches.map((branch) => `
                        <article class="context-row">
                            <div class="context-row__header">
                                <strong>${escapeHtml(branch.name)}</strong>
                                <span class="context-pill ${branch.current ? "context-pill--active" : ""}">
                                    ${branch.current ? "current" : "available"}
                                </span>
                            </div>
                        </article>
                    `).join("") : renderEmptyContextState("No branch cues are available from the active detail payload.")}
                </div>
            </div>
            <div class="workspace-card">
                <div class="workspace-card__header">
                    <span class="control-label">Recent commits</span>
                    <span class="workspace-card__badge">${repositoryContext.commits.length}</span>
                </div>
                <div class="context-list">
                    ${repositoryContext.commits.length > 0 ? repositoryContext.commits.map((commit) => `
                        <article class="context-row">
                            <div class="context-row__header">
                                <strong>${escapeHtml(commit.summary)}</strong>
                                <span class="context-mono">${escapeHtml(commit.id)}</span>
                            </div>
                        </article>
                    `).join("") : renderEmptyContextState("No recent commit cues are available from the active detail payload.")}
                </div>
            </div>
            <div class="workspace-card">
                <div class="workspace-card__header">
                    <span class="control-label">File cues</span>
                    <span class="workspace-card__badge">${repositoryContext.files.length}</span>
                </div>
                <div class="context-list">
                    ${repositoryContext.files.length > 0 ? repositoryContext.files.map((file) => `
                        <article class="context-row">
                            <div class="context-row__header">
                                <strong>${escapeHtml(file.path)}</strong>
                                <span class="context-pill">${escapeHtml(file.status)}</span>
                            </div>
                        </article>
                    `).join("") : renderEmptyContextState("No file cues are available from the active detail payload.")}
                </div>
            </div>
            <div class="workspace-card">
                <div class="workspace-card__header">
                    <span class="control-label">Workspace annotations</span>
                    <span class="workspace-card__badge">${repositoryContext.annotations.length}</span>
                </div>
                <div class="context-list">
                    ${repositoryContext.annotations.length > 0 ? repositoryContext.annotations.map((annotation) => `
                        <article class="context-row context-row--annotation">
                            <span class="control-label">${escapeHtml(annotation.label)}</span>
                            <p class="panel-copy">${escapeHtml(annotation.message)}</p>
                        </article>
                    `).join("") : renderEmptyContextState("No workspace annotations are available from the active detail payload.")}
                </div>
                <div class="workspace-card__actions">
                    <a class="scenario-action" href="#/catalog">Back to catalog</a>
                </div>
            </div>
        </section>
    `;
}

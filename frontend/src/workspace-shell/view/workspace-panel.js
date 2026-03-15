import { renderLessonLane } from "./lesson-layout.js";
import {
    escapeHtml,
} from "./render-helpers.js";

export function renderWorkspacePanel(state) {
    if (state.route !== "exercise") {
        return renderLessonLane({
            lane: "practice",
            label: "Practice lane",
            title: "The right column is reserved for practice surfaces",
            description: "The learner has not entered a scenario yet, but the shell already keeps the practice lane visible instead of hiding it behind a later screen swap.",
            meta: [
                "Mode: catalog",
                "Detail: inactive"
            ],
            body: `
                <section class="workspace-card workspace-card--focus">
                    <div class="workspace-card__header">
                        <span class="control-label">Practice boundary</span>
                        <span class="workspace-card__badge">catalog mode</span>
                    </div>
                    <p class="panel-copy">No exercise detail request is active while the learner remains on the catalog route.</p>
                    <div class="workspace-card__actions">
                        <span class="scenario-link">Select a scenario to reserve the route handoff.</span>
                    </div>
                </section>
            `
        });
    }

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return renderLessonLane({
            lane: "practice",
            label: "Practice lane",
            title: "Practice scaffolding stays mounted while detail loads",
            description: "The right lane keeps its place while the provider resolves the workspace payload for the selected exercise route.",
            meta: [
                `Requested: ${state.selectedScenarioSlug ?? "unknown"}`,
                "Detail: loading"
            ],
            body: `
                <section class="workspace-card workspace-card--focus">
                    <div class="workspace-card__header">
                        <span class="control-label">Detail provider</span>
                        <span class="workspace-card__badge">loading</span>
                    </div>
                    <p class="panel-copy">Requested slug: ${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</p>
                </section>
            `
        });
    }

    if (state.detail.status === "error") {
        return renderLessonLane({
            lane: "practice",
            label: "Practice lane",
            title: "Scenario detail provider seam failed",
            description: "The shell keeps a coherent practice lane even when the active detail provider cannot load the requested scenario.",
            meta: [
                `Provider: ${state.providerName}`,
                "Detail: error"
            ],
            body: `
                <section class="workspace-card workspace-card--focus">
                    <div class="workspace-card__header">
                        <span class="control-label">Detail provider</span>
                        <span class="workspace-card__badge">error</span>
                    </div>
                    <p class="panel-copy">${escapeHtml(state.detail.error ?? "Unknown scenario detail error")}</p>
                    <div class="workspace-card__actions">
                        <a class="scenario-action scenario-action--muted" href="#/catalog">Back to catalog</a>
                    </div>
                </section>
            `
        });
    }

    const detail = state.detail.data;
    const repositoryContext = normalizeRepositoryContext(detail.workspace?.repositoryContext);
    return renderLessonLane({
        lane: "practice",
        label: detail.workspace.shell.rightPanelTitle,
        title: "Repository context now anchors the practice lane",
        description: "Branch, commit, file, and annotation cues stay visible on the right so future answer input and execution output can land here without another shell rewrite.",
        meta: [
            `Context: ${repositoryContext.status}`,
            `Branches: ${repositoryContext.branches.length}`,
            `Files: ${repositoryContext.files.length}`
        ],
        body: `
            <section class="workspace-card workspace-card--focus">
                <div class="workspace-card__header">
                    <span class="control-label">Practice scaffold</span>
                    <span class="workspace-card__badge">${escapeHtml(repositoryContext.status)}</span>
                </div>
                <p class="panel-copy">
                    The right lane is now treated as the durable practice surface, even though the final answer input and execution output work lands in a follow-up task.
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
            </section>
            <section class="workspace-card">
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
            </section>
            <section class="workspace-card">
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
            </section>
            <section class="workspace-card">
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
            </section>
            <section class="workspace-card">
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
            </section>
        `
    });
}

function normalizeRepositoryContext(repositoryContext) {
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

function renderEmptyContextState(message) {
    return `
        <article class="context-row context-row--annotation">
            <span class="control-label">Empty state</span>
            <p class="panel-copy">${escapeHtml(message)}</p>
        </article>
    `;
}

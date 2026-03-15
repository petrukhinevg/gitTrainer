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
            description: "The learner has not opened a task yet, but the shell already keeps the practice lane visible instead of hiding it behind a later screen swap.",
            meta: [
                "Mode: welcome",
                "Detail: inactive"
            ],
            body: `
                <section class="workspace-card workspace-card--focus">
                    <div class="workspace-card__header">
                        <span class="control-label">Practice boundary</span>
                        <span class="workspace-card__badge">welcome mode</span>
                    </div>
                    <p class="panel-copy">No exercise detail request is active while the learner remains on the welcome page.</p>
                    <div class="workspace-card__actions">
                        <span class="scenario-link">Select a task block on the left to reserve the route handoff.</span>
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
                        <a class="scenario-action scenario-action--muted" href="#/catalog">Back to welcome</a>
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
        title: "Practice input and Git context stay visible together",
        description: "The right lane now keeps answer entry and repository context as separate surfaces, so the learner can type and inspect without losing either one.",
        meta: [
            `Context: ${repositoryContext.status}`,
            `Viewer: ${state.practiceContextTab}`,
            `Prepared: ${state.practiceDraft.preparedAnswer ? "yes" : "no"}`
        ],
        body: `
            <section class="workspace-card workspace-card--focus practice-composer">
                <div class="workspace-card__header">
                    <span class="control-label">Practice input</span>
                    <span class="workspace-card__badge">${state.practiceDraft.preparedAnswer ? "prepared" : "draft"}</span>
                </div>
                <p class="panel-copy">Keep the input surface separate from the Git context viewer so branch inspection can stay visible while the learner edits an answer.</p>
                <form class="practice-composer__form" data-practice-draft-form>
                    <label class="practice-composer__field">
                        <span class="control-label">Command draft</span>
                        <textarea name="answer" rows="5" placeholder="Example: git status">${escapeHtml(state.practiceDraft.answer ?? "")}</textarea>
                    </label>
                    <div class="practice-composer__actions">
                        <button class="scenario-action" type="submit">Prepare payload</button>
                        <button class="scenario-action scenario-action--muted" type="button" data-reset-practice-draft>Reset</button>
                    </div>
                </form>
                ${state.practiceDraft.validationError ? `
                    <div class="practice-composer__notice">
                        <span class="control-label">Input check</span>
                        <p class="panel-copy">${escapeHtml(state.practiceDraft.validationError)}</p>
                    </div>
                ` : ""}
                <div class="practice-composer__notice ${state.practiceDraft.preparedAnswer ? "practice-composer__notice--ready" : ""}">
                    <span class="control-label">Submission shell</span>
                    <dl class="result-summary">
                        <div>
                            <dt>Scenario</dt>
                            <dd>${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</dd>
                        </div>
                        <div>
                            <dt>Draft answer</dt>
                            <dd>${escapeHtml(state.practiceDraft.preparedAnswer ?? "No prepared payload yet")}</dd>
                        </div>
                        <div>
                            <dt>Prepared at</dt>
                            <dd>${escapeHtml(state.practiceDraft.preparedAt ?? "Pending")}</dd>
                        </div>
                    </dl>
                </div>
            </section>
            <section class="workspace-card workspace-card--viewer">
                <div class="workspace-card__header">
                    <span class="control-label">Git context viewer</span>
                    <span class="workspace-card__badge">${escapeHtml(state.practiceContextTab)}</span>
                </div>
                <div class="practice-context__tabs" role="tablist" aria-label="Git context viewer">
                    ${renderPracticeContextTab(state, "branches", `Branches ${repositoryContext.branches.length}`)}
                    ${renderPracticeContextTab(state, "commits", `Commits ${repositoryContext.commits.length}`)}
                    ${renderPracticeContextTab(state, "files", `Files ${repositoryContext.files.length}`)}
                    ${renderPracticeContextTab(state, "annotations", `Notes ${repositoryContext.annotations.length}`)}
                </div>
                <div class="practice-context__panel">
                    ${renderPracticeContextPanel(state, repositoryContext)}
                </div>
                <div class="workspace-card__actions">
                    <a class="scenario-action" href="#/catalog">Back to welcome</a>
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

function renderPracticeContextTab(state, value, label) {
    const isActive = state.practiceContextTab === value;
    return `
        <button
            type="button"
            class="practice-context__tab ${isActive ? "practice-context__tab--active" : ""}"
            data-practice-context-tab="${value}"
            aria-pressed="${isActive}"
        >
            ${escapeHtml(label)}
        </button>
    `;
}

function renderPracticeContextPanel(state, repositoryContext) {
    switch (state.practiceContextTab) {
        case "commits":
            return repositoryContext.commits.length > 0
                ? `<div class="context-list">${repositoryContext.commits.map((commit) => `
                    <article class="context-row">
                        <div class="context-row__header">
                            <strong>${escapeHtml(commit.summary)}</strong>
                            <span class="context-mono">${escapeHtml(commit.id)}</span>
                        </div>
                    </article>
                `).join("")}</div>`
                : renderEmptyContextState("No recent commit cues are available from the active detail payload.");
        case "files":
            return repositoryContext.files.length > 0
                ? `<div class="context-list">${repositoryContext.files.map((file) => `
                    <article class="context-row">
                        <div class="context-row__header">
                            <strong>${escapeHtml(file.path)}</strong>
                            <span class="context-pill">${escapeHtml(file.status)}</span>
                        </div>
                    </article>
                `).join("")}</div>`
                : renderEmptyContextState("No file cues are available from the active detail payload.");
        case "annotations":
            return repositoryContext.annotations.length > 0
                ? `<div class="context-list">${repositoryContext.annotations.map((annotation) => `
                    <article class="context-row context-row--annotation">
                        <span class="control-label">${escapeHtml(annotation.label)}</span>
                        <p class="panel-copy">${escapeHtml(annotation.message)}</p>
                    </article>
                `).join("")}</div>`
                : renderEmptyContextState("No workspace annotations are available from the active detail payload.");
        case "branches":
        default:
            return repositoryContext.branches.length > 0
                ? `<div class="context-list">${repositoryContext.branches.map((branch) => `
                    <article class="context-row">
                        <div class="context-row__header">
                            <strong>${escapeHtml(branch.name)}</strong>
                            <span class="context-pill ${branch.current ? "context-pill--active" : ""}">
                                ${branch.current ? "current" : "available"}
                            </span>
                        </div>
                    </article>
                `).join("")}</div>`
                : renderEmptyContextState("No branch cues are available from the active detail payload.");
    }
}

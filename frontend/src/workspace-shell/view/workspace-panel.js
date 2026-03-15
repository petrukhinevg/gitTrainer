import { renderLessonLane } from "./lesson-layout.js";
import { escapeHtml } from "./render-helpers.js";

export function renderWorkspacePanel(state) {
    if (state.route !== "exercise") {
        return renderPracticeShell({
            viewer: renderPlaceholderViewer(
                "Git branch view",
                "Open a task on the left to load the branch picture for that scenario."
            ),
            composer: renderPlaceholderComposer(
                "Command input",
                "The answer field unlocks after you open a task."
            )
        });
    }

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return renderPracticeShell({
            viewer: renderPlaceholderViewer(
                "Loading branch view",
                `Preparing branch context for ${escapeHtml(state.selectedScenarioSlug ?? "the selected task")}.`
            ),
            composer: renderPlaceholderComposer(
                "Command input",
                "The answer field stays mounted while the task detail loads."
            )
        });
    }

    if (state.detail.status === "error") {
        return renderPracticeShell({
            viewer: `
                <section class="workspace-card workspace-card--viewer workspace-card--error">
                    <div class="workspace-card__header">
                        <span class="control-label">Git branch view</span>
                        <span class="workspace-card__badge">error</span>
                    </div>
                    <p class="panel-copy">${escapeHtml(state.detail.error ?? "Unknown scenario detail error")}</p>
                </section>
            `,
            composer: `
                <section class="workspace-card workspace-card--composer workspace-card--focus">
                    <div class="workspace-card__header">
                        <span class="control-label">Command input</span>
                        <span class="workspace-card__badge">locked</span>
                    </div>
                    <p class="panel-copy">The command field is unavailable until the task payload is restored.</p>
                    <div class="workspace-card__actions">
                        <a class="scenario-action scenario-action--muted" href="#/catalog">Back to welcome</a>
                    </div>
                </section>
            `
        });
    }

    const detail = state.detail.data;
    const repositoryContext = normalizeRepositoryContext(detail.workspace?.repositoryContext);

    return renderPracticeShell({
        viewer: `
            <section class="workspace-card workspace-card--viewer">
                <div class="workspace-card__header">
                    <span class="control-label">Git branch view</span>
                    <span class="workspace-card__badge">${escapeHtml(repositoryContext.status)}</span>
                </div>
                <p class="panel-copy">A fixed branch picture stays visible above the input field.</p>
                ${renderBranchGraph(repositoryContext.branches)}
            </section>
        `,
        composer: `
            <section class="workspace-card workspace-card--composer workspace-card--focus practice-composer">
                <div class="workspace-card__header">
                    <span class="control-label">Command input</span>
                    <span class="workspace-card__badge">${state.practiceDraft.preparedAnswer ? "prepared" : "draft"}</span>
                </div>
                <form class="practice-composer__form" data-practice-draft-form>
                    <label class="practice-composer__field">
                        <span class="control-label">Draft answer</span>
                        <textarea name="answer" rows="4" placeholder="Example: git status">${escapeHtml(state.practiceDraft.answer ?? "")}</textarea>
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
                    <p class="panel-copy">${escapeHtml(state.practiceDraft.preparedAnswer ?? "No prepared payload yet")}</p>
                </div>
            </section>
        `
    });
}

function renderPracticeShell({ viewer, composer }) {
    return renderLessonLane({
        lane: "practice",
        label: "Workspace lane",
        title: "Git branch view and command input",
        description: "The right column stays split into two fixed surfaces.",
        showHeader: false,
        body: `
            <div class="practice-stack">
                ${viewer}
                ${composer}
            </div>
        `
    });
}

function renderPlaceholderViewer(title, copy) {
    return `
        <section class="workspace-card workspace-card--viewer">
            <div class="workspace-card__header">
                <span class="control-label">${escapeHtml(title)}</span>
                <span class="workspace-card__badge">idle</span>
            </div>
            <p class="panel-copy">${escapeHtml(copy)}</p>
            <div class="branch-graph branch-graph--placeholder" aria-hidden="true">
                <div class="branch-graph__row">
                    <span class="branch-graph__node"></span>
                    <span class="branch-graph__track"></span>
                    <div class="branch-graph__label">
                        <strong>main</strong>
                        <span>waiting for task context</span>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderPlaceholderComposer(title, copy) {
    return `
        <section class="workspace-card workspace-card--composer workspace-card--focus">
            <div class="workspace-card__header">
                <span class="control-label">${escapeHtml(title)}</span>
                <span class="workspace-card__badge">idle</span>
            </div>
            <p class="panel-copy">${escapeHtml(copy)}</p>
            <label class="practice-composer__field">
                <span class="control-label">Draft answer</span>
                <textarea rows="4" placeholder="Example: git status" disabled></textarea>
            </label>
        </section>
    `;
}

function normalizeRepositoryContext(repositoryContext) {
    const safeContext = repositoryContext ?? {};
    return {
        status: typeof safeContext.status === "string" && safeContext.status.trim() !== ""
            ? safeContext.status
            : "unavailable",
        branches: Array.isArray(safeContext.branches) ? safeContext.branches : []
    };
}

function renderBranchGraph(branches) {
    if (!branches.length) {
        return `
            <div class="branch-graph branch-graph--empty">
                <div class="branch-graph__empty">
                    <span class="control-label">Empty state</span>
                    <p class="panel-copy">No branch cues are available from the active detail payload.</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="branch-graph" aria-label="Git branch picture">
            ${branches.map((branch, index) => `
                <article class="branch-graph__row ${branch.current ? "branch-graph__row--current" : ""}">
                    <span class="branch-graph__node"></span>
                    <span class="branch-graph__track ${index === branches.length - 1 ? "branch-graph__track--last" : ""}"></span>
                    <div class="branch-graph__label">
                        <strong>${escapeHtml(branch.name)}</strong>
                        <span>${branch.current ? "current branch" : "available branch"}</span>
                    </div>
                </article>
            `).join("")}
        </div>
    `;
}

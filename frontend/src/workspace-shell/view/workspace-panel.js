import { renderLessonLane } from "./lesson-layout.js";
import { escapeHtml } from "./render-helpers.js";

export function renderWorkspacePanel(state) {
    if (state.route !== "exercise") {
        return renderPracticeShell({
            viewer: renderPlaceholderViewer(
                "Git branches",
                "Open a task on the left to load the branch view."
            ),
            composer: renderPlaceholderComposer(
                "Command",
                "Input unlocks after you open a task."
            )
        });
    }

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return renderPracticeShell({
            viewer: renderPlaceholderViewer(
                "Git branches",
                `Loading branch view for ${escapeHtml(state.selectedScenarioSlug ?? "the selected task")}.`
            ),
            composer: renderPlaceholderComposer(
                "Command",
                "Input stays mounted while the task detail loads."
            )
        });
    }

    if (state.detail.status === "error") {
        return renderPracticeShell({
            viewer: `
                <section class="workspace-card workspace-card--viewer workspace-card--error">
                    <div class="workspace-card__header">
                        <span class="control-label">Git branches</span>
                        <span class="workspace-card__badge">error</span>
                    </div>
                    <div class="practice-inline-note">
                        <p class="panel-copy">${escapeHtml(state.detail.error ?? "Unknown scenario detail error")}</p>
                    </div>
                </section>
            `,
            composer: `
                <section class="workspace-card workspace-card--composer workspace-card--focus">
                    <div class="workspace-card__header">
                        <span class="control-label">Command</span>
                        <span class="workspace-card__badge">locked</span>
                    </div>
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
                    <span class="control-label">Git branches</span>
                    <span class="workspace-card__badge">${escapeHtml(repositoryContext.status)}</span>
                </div>
                <div class="practice-shell__meta">
                    <span class="practice-shell__chip">Branches: ${repositoryContext.branches.length}</span>
                    <span class="practice-shell__chip">Files: ${repositoryContext.files.length}</span>
                    <span class="practice-shell__chip">Status: ${escapeHtml(repositoryContext.status)}</span>
                </div>
                ${renderBranchGraph(repositoryContext.branches)}
                <div class="practice-output">
                    <span class="control-label">Output scaffold</span>
                    <p class="panel-copy">This slot is reserved for branch feedback or command output once submit transport lands on top of the current local draft seam.</p>
                </div>
            </section>
        `,
        composer: `
            <section class="workspace-card workspace-card--composer workspace-card--focus practice-composer">
                <div class="workspace-card__header">
                    <span class="control-label">Answer input</span>
                    <span class="workspace-card__badge">${resolveDraftBadge(state.submissionDraft)}</span>
                </div>
                <div class="practice-shell__meta">
                    <span class="practice-shell__chip">Answer type: command text</span>
                    <span class="practice-shell__chip">Scenario: ${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</span>
                </div>
                <form class="practice-composer__form" data-submission-draft-form>
                    <input type="hidden" name="answerType" value="command_text">
                    <label class="practice-editor">
                        <span class="practice-editor__prompt">&gt;</span>
                        <textarea name="answer" rows="4" placeholder="Example: git status">${escapeHtml(state.submissionDraft.answer ?? "")}</textarea>
                    </label>
                    <div class="practice-composer__actions">
                        <button class="practice-action practice-action--primary" type="submit">Prepare submission</button>
                        <button class="practice-action" type="button" data-reset-submission-draft>Reset draft</button>
                    </div>
                </form>
                ${state.submissionDraft.validationError ? `
                    <div class="practice-inline-note">
                        <p class="panel-copy">${escapeHtml(state.submissionDraft.validationError)}</p>
                    </div>
                ` : ""}
                ${renderPreparedSubmission(state.submissionDraft.preparedSubmission)}
            </section>
        `
    });
}

function renderPracticeShell({ viewer, composer }) {
    return renderLessonLane({
        lane: "practice",
        label: "Workspace lane",
        title: "Git branches and command input",
        description: "The right column stays split into two fixed surfaces.",
        showHeader: false,
        body: `
            <div class="practice-stack">
                <div class="practice-pane practice-pane--viewer">${viewer}</div>
                <div class="practice-pane practice-pane--composer">${composer}</div>
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
            <div class="practice-inline-note">
                <p class="panel-copy">${escapeHtml(copy)}</p>
            </div>
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
            <div class="practice-inline-note">
                <p class="panel-copy">${escapeHtml(copy)}</p>
            </div>
            <label class="practice-editor">
                <span class="practice-editor__prompt">&gt;</span>
                <textarea rows="4" placeholder="Example: git status" disabled></textarea>
            </label>
            <div class="practice-output">
                <span class="control-label">Output scaffold</span>
                <p class="panel-copy">Prepared payload and execution feedback appear here after a scenario is opened.</p>
            </div>
        </section>
    `;
}

function normalizeRepositoryContext(repositoryContext) {
    const safeContext = repositoryContext ?? {};
    return {
        status: typeof safeContext.status === "string" && safeContext.status.trim() !== ""
            ? safeContext.status
            : "unavailable",
        branches: Array.isArray(safeContext.branches) ? safeContext.branches : [],
        files: Array.isArray(safeContext.files) ? safeContext.files : []
    };
}

function resolveDraftBadge(submissionDraft) {
    if (submissionDraft?.preparedSubmission) {
        return "prepared";
    }

    if (typeof submissionDraft?.answer === "string" && submissionDraft.answer.trim() !== "") {
        return "draft";
    }

    return "idle";
}

function renderPreparedSubmission(preparedSubmission) {
    if (!preparedSubmission) {
        return `
            <div class="practice-output">
                <span class="control-label">Prepared payload</span>
                <p class="panel-copy">The right lane now owns local answer drafting. Session transport and correctness rendering still land in later tasks.</p>
            </div>
        `;
    }

    return `
        <div class="practice-output practice-output--ready">
            <span class="control-label">Prepared payload</span>
            <dl class="result-summary">
                <div>
                    <dt>Scenario</dt>
                    <dd>${escapeHtml(preparedSubmission.scenarioSlug ?? "unknown")}</dd>
                </div>
                <div>
                    <dt>Answer type</dt>
                    <dd>${escapeHtml(preparedSubmission.answerType)}</dd>
                </div>
                <div>
                    <dt>Draft answer</dt>
                    <dd>${escapeHtml(preparedSubmission.answer)}</dd>
                </div>
                <div>
                    <dt>Prepared at</dt>
                    <dd>${escapeHtml(preparedSubmission.preparedAt)}</dd>
                </div>
            </dl>
        </div>
    `;
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

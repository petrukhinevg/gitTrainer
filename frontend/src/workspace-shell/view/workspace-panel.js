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
    const bootstrapState = normalizeBootstrapState(state.session?.bootstrap);
    const submissionState = normalizeSubmissionState(state.session?.submission);
    const lifecycle = submissionState.response?.lifecycle ?? bootstrapState.response?.lifecycle ?? null;
    const submitDisabled = isSubmitDisabled(bootstrapState, submissionState);
    const resetDisabled = bootstrapState.status === "pending" || submissionState.status === "pending";

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
                    <span class="practice-shell__chip">Session: ${escapeHtml(resolveTransportBadge(bootstrapState, submissionState))}</span>
                </div>
                ${renderBranchGraph(repositoryContext.branches)}
                ${renderSessionTransportOutput(bootstrapState, lifecycle)}
            </section>
        `,
        composer: `
            <section class="workspace-card workspace-card--composer workspace-card--focus practice-composer">
                <div class="workspace-card__header">
                    <span class="control-label">Answer input</span>
                    <span class="workspace-card__badge">${resolveDraftBadge(state.submissionDraft, submissionState)}</span>
                </div>
                <div class="practice-shell__meta">
                    <span class="practice-shell__chip">Answer type: ${escapeHtml(resolveActiveAnswerType(state.submissionDraft))}</span>
                    <span class="practice-shell__chip">Scenario: ${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</span>
                    <span class="practice-shell__chip">Attempts: ${escapeHtml(String(lifecycle?.submissionCount ?? 0))}</span>
                </div>
                ${renderBootstrapNotice(bootstrapState)}
                <form class="practice-composer__form" data-submission-draft-form>
                    <div class="practice-composer__controls">
                        <label class="practice-select">
                            <span class="control-label">Answer type</span>
                            <select name="answerType"${submissionState.status === "pending" ? " disabled" : ""}>
                                <option value="command_text"${resolveSelectedAnswerType(state.submissionDraft, "command_text")}>Command text</option>
                                <option value="file_patch"${resolveSelectedAnswerType(state.submissionDraft, "file_patch")}>File patch preview</option>
                            </select>
                        </label>
                    </div>
                    <label class="practice-editor">
                        <span class="practice-editor__prompt">&gt;</span>
                        <textarea name="answer" rows="4" placeholder="Example: git status"${submissionState.status === "pending" ? " disabled" : ""}>${escapeHtml(state.submissionDraft.answer ?? "")}</textarea>
                    </label>
                    <div class="practice-composer__actions">
                        <button class="practice-action practice-action--primary" type="submit"${submitDisabled ? " disabled" : ""}>${escapeHtml(resolvePrimaryActionLabel(bootstrapState, submissionState))}</button>
                        <button class="practice-action" type="button" data-reset-submission-draft${resetDisabled ? " disabled" : ""}>Reset draft</button>
                    </div>
                </form>
                ${state.submissionDraft.validationError ? `
                    <div class="practice-inline-note">
                        <p class="panel-copy">${escapeHtml(state.submissionDraft.validationError)}</p>
                    </div>
                ` : ""}
                ${renderSubmissionTransportOutput(
                    state.submissionDraft.preparedSubmission,
                    submissionState,
                    bootstrapState.response?.submission?.supportedAnswerTypes ?? []
                )}
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
                <div class="practice-pane practice-pane--composer">${composer}</div>
                <div class="practice-pane practice-pane--viewer">${viewer}</div>
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
                <p class="panel-copy">Prepared payload and transport feedback appear here after a scenario is opened.</p>
            </div>
        </section>
    `;
}

function renderSessionTransportOutput(bootstrapState, lifecycle) {
    if (bootstrapState.status === "pending") {
        return renderRequestStateBlock({
            label: "Session transport",
            status: "pending",
            badge: "pending",
            copy: "Bootstrapping a session for the active scenario before submissions are sent."
        });
    }

    if (bootstrapState.status === "retryable-error") {
        return renderRequestStateBlock({
            label: "Session transport",
            status: "retryable",
            badge: "retryable",
            copy: bootstrapState.error?.message ?? "Session bootstrap failed.",
            actions: `
                <button class="practice-action practice-action--primary" type="button" data-session-request-retry="bootstrap">Retry session</button>
            `
        });
    }

    if (bootstrapState.status === "terminal-error") {
        return renderRequestStateBlock({
            label: "Session transport",
            status: "terminal",
            badge: "terminal",
            copy: bootstrapState.error?.message ?? "Session bootstrap failed in a terminal way."
        });
    }

    if (bootstrapState.status !== "ready" || !bootstrapState.response) {
        return renderRequestStateBlock({
            label: "Session transport",
            status: "idle",
            badge: "idle",
            copy: "A session starts automatically after the exercise route resolves."
        });
    }

    return `
        <div class="practice-output practice-output--ready">
            <span class="control-label">Session transport</span>
            <dl class="result-summary">
                <div>
                    <dt>Session id</dt>
                    <dd>${escapeHtml(bootstrapState.response.sessionId)}</dd>
                </div>
                <div>
                    <dt>Lifecycle</dt>
                    <dd>${escapeHtml(lifecycle?.status ?? bootstrapState.response.lifecycle?.status ?? "active")}</dd>
                </div>
                <div>
                    <dt>Submissions</dt>
                    <dd>${escapeHtml(String(lifecycle?.submissionCount ?? bootstrapState.response.lifecycle?.submissionCount ?? 0))}</dd>
                </div>
                <div>
                    <dt>Answer types</dt>
                    <dd>${escapeHtml((bootstrapState.response.submission?.supportedAnswerTypes ?? []).join(", ") || "unknown")}</dd>
                </div>
            </dl>
            <p class="panel-copy">${escapeHtml(resolveSubmissionBoundaryCopy(bootstrapState.response.submission))}</p>
        </div>
    `;
}

function renderBootstrapNotice(bootstrapState) {
    if (bootstrapState.status === "pending") {
        return `
            <div class="practice-request practice-request--pending">
                <span class="control-label">Request state</span>
                <p class="panel-copy">Starting a session for this scenario. Submission unlocks when the transport is ready.</p>
            </div>
        `;
    }

    if (bootstrapState.status === "retryable-error") {
        return `
            <div class="practice-request practice-request--retryable">
                <span class="control-label">Request state</span>
                <p class="panel-copy">${escapeHtml(bootstrapState.error?.message ?? "Session bootstrap failed.")}</p>
                <div class="practice-output__actions">
                    <button class="practice-action practice-action--primary" type="button" data-session-request-retry="bootstrap">Retry session</button>
                </div>
            </div>
        `;
    }

    if (bootstrapState.status === "terminal-error") {
        return `
            <div class="practice-request practice-request--terminal">
                <span class="control-label">Request state</span>
                <p class="panel-copy">${escapeHtml(bootstrapState.error?.message ?? "Session bootstrap failed in a terminal way.")}</p>
            </div>
        `;
    }

    return "";
}

function renderSubmissionTransportOutput(preparedSubmission, submissionState, supportedAnswerTypes) {
    if (submissionState.status === "pending") {
        return renderSubmissionRequestBlock({
            label: "Submission transport",
            status: "pending",
            badge: "pending",
            copy: "Sending the prepared answer through the active session.",
            payload: submissionState.lastPayload
        });
    }

    if (submissionState.status === "retryable-error") {
        return renderSubmissionRequestBlock({
            label: "Submission transport",
            status: "retryable",
            badge: "retryable",
            copy: submissionState.error?.message ?? "Submission failed and can be retried.",
            payload: submissionState.lastPayload,
            actions: `
                <button class="practice-action practice-action--primary" type="button" data-session-request-retry="submission">Retry submit</button>
            `
        });
    }

    if (submissionState.status === "terminal-error") {
        return renderSubmissionRequestBlock({
            label: "Submission transport",
            status: "terminal",
            badge: "terminal",
            copy: submissionState.error?.message ?? "Submission failed in a terminal way.",
            payload: submissionState.lastPayload,
            actions: `
                <button class="practice-action practice-action--primary" type="button" data-session-request-restart>Start new session</button>
            `
        });
    }

    if (submissionState.status === "ready" && submissionState.response) {
        const outcome = submissionState.response.outcome ?? null;
        return `
            ${renderCorrectnessFeedbackBlock(submissionState.response, supportedAnswerTypes)}
            <div class="practice-output practice-output--ready">
                <div class="practice-output__header">
                    <span class="control-label">Submission receipt</span>
                    <span class="workspace-card__badge">${escapeHtml(resolveSubmissionReceiptBadge(outcome))}</span>
                </div>
                <dl class="result-summary">
                    <div>
                        <dt>Submission id</dt>
                        <dd>${escapeHtml(submissionState.response.submissionId)}</dd>
                    </div>
                    <div>
                        <dt>Attempt</dt>
                        <dd>${escapeHtml(String(submissionState.response.attemptNumber))}</dd>
                    </div>
                    <div>
                        <dt>Submitted at</dt>
                        <dd>${escapeHtml(submissionState.response.submittedAt)}</dd>
                    </div>
                    <div>
                        <dt>Answer type</dt>
                        <dd>${escapeHtml(submissionState.response.answer?.type ?? "unknown")}</dd>
                    </div>
                    <div>
                        <dt>Answer value</dt>
                        <dd>${escapeHtml(submissionState.response.answer?.value ?? "")}</dd>
                    </div>
                </dl>
                <p class="panel-copy">Submission transport is complete and the evaluated outcome is rendered above.</p>
            </div>
        `;
    }

    if (preparedSubmission) {
        return `
            <div class="practice-output practice-output--ready">
                <span class="control-label">Prepared payload</span>
                ${renderPreparedPayloadSummary(preparedSubmission)}
                <p class="panel-copy">The answer is ready for transport once the active session is available.</p>
            </div>
        `;
    }

    return `
        <div class="practice-output">
            <span class="control-label">Submission transport</span>
            <p class="panel-copy">Transport feedback appears here after the active session accepts a submission.</p>
        </div>
    `;
}

function renderSubmissionRequestBlock({ label, status, badge, copy, payload, actions = "" }) {
    return `
        <div class="practice-output practice-output--${escapeHtml(status)}">
            <div class="practice-output__header">
                <span class="control-label">${escapeHtml(label)}</span>
                <span class="workspace-card__badge">${escapeHtml(badge)}</span>
            </div>
            <p class="panel-copy">${escapeHtml(copy)}</p>
            ${payload ? renderPreparedPayloadSummary(payload) : ""}
            ${actions ? `<div class="practice-output__actions">${actions}</div>` : ""}
        </div>
    `;
}

function renderRequestStateBlock({ label, status, badge, copy, actions = "" }) {
    return `
        <div class="practice-output practice-output--${escapeHtml(status)}">
            <div class="practice-output__header">
                <span class="control-label">${escapeHtml(label)}</span>
                <span class="workspace-card__badge">${escapeHtml(badge)}</span>
            </div>
            <p class="panel-copy">${escapeHtml(copy)}</p>
            ${actions ? `<div class="practice-output__actions">${actions}</div>` : ""}
        </div>
    `;
}

function renderPreparedPayloadSummary(preparedSubmission) {
    return `
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
    `;
}

function renderCorrectnessFeedbackBlock(submissionResponse, supportedAnswerTypes) {
    const outcome = submissionResponse?.outcome ?? null;
    if (!outcome) {
        return `
            <div class="practice-output practice-output--ready">
                <span class="control-label">Correctness feedback</span>
                <p class="panel-copy">Submission completed, but no evaluated outcome is available yet.</p>
            </div>
        `;
    }

    const correctness = normalizeOutcomeCorrectness(outcome.correctness);
    const tone = resolveOutcomeTone(correctness);
    const supportedTypesCopy = supportedAnswerTypes.length ? supportedAnswerTypes.join(", ") : "command_text";

    return `
        <div class="practice-output practice-output--${escapeHtml(tone)}">
            <div class="practice-output__header">
                <span class="control-label">Correctness feedback</span>
                <span class="workspace-card__badge">${escapeHtml(correctness)}</span>
            </div>
            <div class="practice-feedback">
                <div class="practice-feedback__summary">
                    <h4 class="practice-feedback__title">${escapeHtml(resolveOutcomeTitle(correctness))}</h4>
                    <p class="panel-copy">${escapeHtml(outcome.message ?? "Outcome message is unavailable.")}</p>
                </div>
                <div class="practice-feedback__meta">
                    <span class="practice-feedback__pill">Status: ${escapeHtml(outcome.status ?? "unknown")}</span>
                    <span class="practice-feedback__pill">Code: ${escapeHtml(outcome.code ?? "unknown")}</span>
                    <span class="practice-feedback__pill">Answer type: ${escapeHtml(submissionResponse.answer?.type ?? "unknown")}</span>
                    <span class="practice-feedback__pill">Attempt: ${escapeHtml(String(submissionResponse.attemptNumber ?? "?"))}</span>
                </div>
                ${correctness === "unsupported" ? `
                    <div class="practice-inline-note practice-inline-note--warning">
                        <p class="panel-copy">
                            This session currently supports: ${escapeHtml(supportedTypesCopy)}.
                            Switch the answer type back to a supported value to re-submit.
                        </p>
                    </div>
                ` : ""}
            </div>
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

function normalizeBootstrapState(bootstrapState) {
    const safeState = bootstrapState ?? {};
    return {
        status: typeof safeState.status === "string" ? safeState.status : "idle",
        response: safeState.response ?? null,
        error: safeState.error ?? null
    };
}

function normalizeSubmissionState(submissionState) {
    const safeState = submissionState ?? {};
    return {
        status: typeof safeState.status === "string" ? safeState.status : "idle",
        response: safeState.response ?? null,
        error: safeState.error ?? null,
        lastPayload: safeState.lastPayload ?? null
    };
}

function isSubmitDisabled(bootstrapState, submissionState) {
    if (submissionState.status === "pending") {
        return true;
    }

    return bootstrapState.status !== "ready";
}

function resolveDraftBadge(submissionDraft, submissionState) {
    if (submissionState.status === "pending") {
        return "submitting";
    }

    if (submissionState.status === "ready") {
        return normalizeOutcomeCorrectness(submissionState.response?.outcome?.correctness);
    }

    if (submissionState.status === "retryable-error") {
        return "retryable";
    }

    if (submissionState.status === "terminal-error") {
        return "terminal";
    }

    if (submissionDraft?.preparedSubmission) {
        return "prepared";
    }

    if (typeof submissionDraft?.answer === "string" && submissionDraft.answer.trim() !== "") {
        return "draft";
    }

    return "idle";
}

function resolvePrimaryActionLabel(bootstrapState, submissionState) {
    if (submissionState.status === "pending") {
        return "Submitting...";
    }

    if (bootstrapState.status === "pending") {
        return "Starting session...";
    }

    if (bootstrapState.status === "retryable-error") {
        return "Retry session first";
    }

    if (bootstrapState.status === "terminal-error") {
        return "Session unavailable";
    }

    if (bootstrapState.status === "ready") {
        return "Submit answer";
    }

    return "Preparing session...";
}

function resolveTransportBadge(bootstrapState, submissionState) {
    if (submissionState.status === "pending") {
        return "submitting";
    }

    if (submissionState.status === "retryable-error") {
        return "retryable";
    }

    if (submissionState.status === "terminal-error") {
        return "terminal";
    }

    if (submissionState.status === "ready") {
        return normalizeOutcomeCorrectness(submissionState.response?.outcome?.correctness);
    }

    if (bootstrapState.status === "ready") {
        return "active";
    }

    if (bootstrapState.status === "pending") {
        return "booting";
    }

    if (bootstrapState.status === "retryable-error") {
        return "retryable";
    }

    if (bootstrapState.status === "terminal-error") {
        return "terminal";
    }

    return "idle";
}

function resolveActiveAnswerType(submissionDraft) {
    return submissionDraft?.answerType === "file_patch" ? "file patch preview" : "command text";
}

function resolveSelectedAnswerType(submissionDraft, value) {
    return submissionDraft?.answerType === value ? " selected" : "";
}

function normalizeOutcomeCorrectness(correctness) {
    return typeof correctness === "string" && correctness.trim() !== ""
        ? correctness
        : "submitted";
}

function resolveOutcomeTone(correctness) {
    switch (correctness) {
        case "correct":
            return "correct";
        case "incorrect":
            return "incorrect";
        case "unsupported":
            return "unsupported";
        default:
            return "ready";
    }
}

function resolveOutcomeTitle(correctness) {
    switch (correctness) {
        case "correct":
            return "Correct next action";
        case "incorrect":
            return "Not the expected command";
        case "unsupported":
            return "Unsupported answer type";
        default:
            return "Submission accepted";
    }
}

function resolveSubmissionReceiptBadge(outcome) {
    return normalizeOutcomeCorrectness(outcome?.correctness);
}

function resolveSubmissionBoundaryCopy(submissionBoundary) {
    const placeholderOutcome = submissionBoundary?.placeholderOutcome ?? null;
    const boundaryMessage = typeof placeholderOutcome?.message === "string" && placeholderOutcome.message.trim() !== ""
        ? placeholderOutcome.message
        : "Session transport is ready for the first evaluated submission.";
    const supportedTypesCopy = Array.isArray(submissionBoundary?.supportedAnswerTypes)
        ? submissionBoundary.supportedAnswerTypes.join(", ")
        : "";

    if (!supportedTypesCopy) {
        return boundaryMessage;
    }

    return `${boundaryMessage} Supported answer types: ${supportedTypesCopy}.`;
}

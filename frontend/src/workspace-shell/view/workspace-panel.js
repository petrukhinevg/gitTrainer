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
    const feedbackPanelState = normalizeFeedbackPanelState(state.session?.feedbackPanel);
    const lifecycle = submissionState.response?.lifecycle ?? bootstrapState.response?.lifecycle ?? null;
    const retryFeedback = resolveRetryFeedback(feedbackPanelState, bootstrapState, submissionState);
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
                ${renderRetryFeedbackPanel(feedbackPanelState, retryFeedback, submissionState)}
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

function renderRetryFeedbackPanel(feedbackPanelState, retryFeedback, submissionState) {
    const normalizedFeedback = normalizeRetryFeedback(retryFeedback);
    const preservedContext = normalizeFeedbackContextSnapshot(feedbackPanelState.contextSnapshot);
    const copy = resolveFeedbackPanelCopy(feedbackPanelState.status, normalizedFeedback, submissionState);
    const tone = resolveFeedbackPanelTone(feedbackPanelState.status, normalizedFeedback, submissionState);
    const revealedHints = normalizedFeedback.hint.reveals.slice(0, feedbackPanelState.revealedHintCount);
    const nextHint = normalizedFeedback.hint.reveals[feedbackPanelState.revealedHintCount] ?? null;

    return `
        <div class="practice-output practice-output--${escapeHtml(tone)}" data-retry-feedback-panel data-retry-feedback-status="${escapeHtml(normalizedFeedback.status)}">
            <div class="practice-output__header">
                <span class="control-label">Retry feedback</span>
                <span class="workspace-card__badge">${escapeHtml(resolveFeedbackPanelBadge(feedbackPanelState.status, normalizedFeedback, submissionState))}</span>
            </div>
            <p class="panel-copy">${escapeHtml(copy)}</p>
            <div class="practice-output practice-output--ready" data-retry-context-summary>
                <span class="control-label">Preserved exercise context</span>
                <dl class="result-summary">
                    <div>
                        <dt>Scenario</dt>
                        <dd>${escapeHtml(preservedContext.scenarioTitle)}</dd>
                    </div>
                    <div>
                        <dt>Goal</dt>
                        <dd>${escapeHtml(preservedContext.goal)}</dd>
                    </div>
                    <div>
                        <dt>Branch</dt>
                        <dd>${escapeHtml(preservedContext.currentBranch)}</dd>
                    </div>
                    <div>
                        <dt>Repo cues</dt>
                        <dd>${escapeHtml(`${preservedContext.branchCount} branches, ${preservedContext.fileCount} files`)}</dd>
                    </div>
                    <div>
                        <dt>Last answer type</dt>
                        <dd>${escapeHtml(preservedContext.answerType)}</dd>
                    </div>
                    <div>
                        <dt>Last answer</dt>
                        <dd>${escapeHtml(preservedContext.answer || "No answer prepared yet.")}</dd>
                    </div>
                    <div>
                        <dt>Attempt</dt>
                        <dd>${escapeHtml(String(preservedContext.attemptNumber))}</dd>
                    </div>
                    <div>
                        <dt>Transport</dt>
                        <dd>${escapeHtml(preservedContext.transportDisposition)}</dd>
                    </div>
                </dl>
                ${preservedContext.errorMessage ? `
                    <div class="practice-inline-note practice-inline-note--warning">
                        <p class="panel-copy">${escapeHtml(preservedContext.errorMessage)}</p>
                    </div>
                ` : ""}
            </div>
            <div class="practice-feedback">
                <div class="practice-feedback__summary">
                    <h4 class="practice-feedback__title">${escapeHtml(normalizedFeedback.explanation.title)}</h4>
                    <p class="panel-copy" data-retry-explanation>${escapeHtml(normalizedFeedback.explanation.message)}</p>
                    ${normalizedFeedback.explanation.tone === "partial" ? `
                        <div class="practice-inline-note practice-inline-note--warning" data-partial-match-message>
                            <p class="panel-copy">The answer is close enough to keep the learner in the same problem space, but it still needs a more exact command.</p>
                        </div>
                    ` : ""}
                    ${normalizedFeedback.explanation.details.length ? `
                        <ul class="practice-feedback__detail-list">
                            ${normalizedFeedback.explanation.details.map((detail) => `
                                <li>${escapeHtml(detail)}</li>
                            `).join("")}
                        </ul>
                    ` : ""}
                </div>
                <div class="practice-feedback__meta">
                    <span class="practice-feedback__pill" data-retry-state-status="${escapeHtml(normalizedFeedback.retryState.status)}">Attempt: ${escapeHtml(String(normalizedFeedback.retryState.attemptNumber))}</span>
                    <span class="practice-feedback__pill" data-retry-eligibility="${escapeHtml(normalizedFeedback.retryState.eligibility)}">Eligibility: ${escapeHtml(normalizedFeedback.retryState.eligibility)}</span>
                    <span class="practice-feedback__pill" data-retry-hint-level="${escapeHtml(normalizedFeedback.hint.level)}">Hint level: ${escapeHtml(normalizedFeedback.hint.level)}</span>
                    <span class="practice-feedback__pill">Explanation: ${escapeHtml(normalizedFeedback.explanation.status)}</span>
                    <span class="practice-feedback__pill">Tone: ${escapeHtml(normalizedFeedback.explanation.tone)}</span>
                </div>
                <div class="practice-inline-note" data-retry-feedback-slot="eligibility">
                    <p class="panel-copy">${escapeHtml(resolveRetryEligibilityCopy(normalizedFeedback))}</p>
                </div>
                <div class="practice-inline-note" data-retry-feedback-slot="hint">
                    <p class="panel-copy">${escapeHtml(normalizedFeedback.hint.message)}</p>
                    ${revealedHints.length ? `
                        <div class="practice-feedback__reveal-list">
                            ${revealedHints.map((hint) => `
                                <article class="practice-feedback__reveal" data-retry-hint-card="${escapeHtml(hint.id)}">
                                    <span class="control-label">${escapeHtml(hint.title)}</span>
                                    <p class="panel-copy">${escapeHtml(hint.message)}</p>
                                </article>
                            `).join("")}
                        </div>
                    ` : ""}
                    ${nextHint ? `
                        <div class="practice-output__actions">
                            <button class="practice-action" type="button" data-retry-hint-reveal>${escapeHtml(nextHint.label)}</button>
                        </div>
                    ` : ""}
                </div>
            </div>
        </div>
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

function normalizeFeedbackPanelState(feedbackPanelState) {
    const safeState = feedbackPanelState ?? {};
    return {
        status: typeof safeState.status === "string" && safeState.status.trim() !== ""
            ? safeState.status
            : "idle",
        contextSnapshot: safeState.contextSnapshot ?? null,
        retryFeedback: safeState.retryFeedback ?? null,
        revealedHintCount: typeof safeState.revealedHintCount === "number"
            ? safeState.revealedHintCount
            : 0
    };
}

function resolveRetryFeedback(feedbackPanelState, bootstrapState, submissionState) {
    return submissionState.response?.retryFeedback
        ?? feedbackPanelState.retryFeedback
        ?? bootstrapState.response?.submission?.placeholderRetryFeedback
        ?? null;
}

function normalizeRetryFeedback(retryFeedback) {
    const safeFeedback = retryFeedback ?? {};
    const retryState = safeFeedback.retryState ?? {};
    const explanation = safeFeedback.explanation ?? {};
    const hint = safeFeedback.hint ?? {};

    return {
        status: typeof safeFeedback.status === "string" && safeFeedback.status.trim() !== ""
            ? safeFeedback.status
            : "placeholder",
        retryState: {
            status: typeof retryState.status === "string" && retryState.status.trim() !== ""
                ? retryState.status
                : "idle",
            attemptNumber: typeof retryState.attemptNumber === "number"
                ? retryState.attemptNumber
                : 0,
            eligibility: typeof retryState.eligibility === "string" && retryState.eligibility.trim() !== ""
                ? retryState.eligibility
                : "not-needed"
        },
        explanation: {
            status: typeof explanation.status === "string" && explanation.status.trim() !== ""
                ? explanation.status
                : "placeholder",
            title: typeof explanation.title === "string" && explanation.title.trim() !== ""
                ? explanation.title
                : "Retry guidance",
            tone: typeof explanation.tone === "string" && explanation.tone.trim() !== ""
                ? explanation.tone
                : "neutral",
            message: typeof explanation.message === "string" && explanation.message.trim() !== ""
                ? explanation.message
                : "Retry guidance will mount here after the first evaluated submission.",
            details: Array.isArray(explanation.details)
                ? explanation.details.filter((detail) => typeof detail === "string" && detail.trim() !== "")
                : []
        },
        hint: {
            status: typeof hint.status === "string" && hint.status.trim() !== ""
                ? hint.status
                : "placeholder",
            level: typeof hint.level === "string" && hint.level.trim() !== ""
                ? hint.level
                : "baseline",
            message: typeof hint.message === "string" && hint.message.trim() !== ""
                ? hint.message
                : "Hint progression is idle until the learner receives evaluated feedback.",
            reveals: Array.isArray(hint.reveals)
                ? hint.reveals
                    .filter((item) => item && typeof item === "object")
                    .map((item, index) => ({
                        id: typeof item.id === "string" && item.id.trim() !== ""
                            ? item.id
                            : `hint-${index + 1}`,
                        label: typeof item.label === "string" && item.label.trim() !== ""
                            ? item.label
                            : "Reveal hint",
                        title: typeof item.title === "string" && item.title.trim() !== ""
                            ? item.title
                            : "Hint",
                        message: typeof item.message === "string" && item.message.trim() !== ""
                            ? item.message
                            : "Additional hint content is unavailable."
                    }))
                : []
        }
    };
}

function normalizeFeedbackContextSnapshot(contextSnapshot) {
    const safeContext = contextSnapshot ?? {};
    return {
        scenarioTitle: typeof safeContext.scenarioTitle === "string" && safeContext.scenarioTitle.trim() !== ""
            ? safeContext.scenarioTitle
            : "Active exercise",
        goal: typeof safeContext.goal === "string" && safeContext.goal.trim() !== ""
            ? safeContext.goal
            : "Retry context will stay anchored to the current exercise.",
        currentBranch: typeof safeContext.currentBranch === "string" && safeContext.currentBranch.trim() !== ""
            ? safeContext.currentBranch
            : "unknown",
        branchCount: typeof safeContext.branchCount === "number" ? safeContext.branchCount : 0,
        fileCount: typeof safeContext.fileCount === "number" ? safeContext.fileCount : 0,
        answerType: typeof safeContext.answerType === "string" && safeContext.answerType.trim() !== ""
            ? safeContext.answerType
            : "command_text",
        answer: typeof safeContext.answer === "string" ? safeContext.answer : "",
        attemptNumber: typeof safeContext.attemptNumber === "number" ? safeContext.attemptNumber : 0,
        transportDisposition: typeof safeContext.transportDisposition === "string" && safeContext.transportDisposition.trim() !== ""
            ? safeContext.transportDisposition
            : "idle",
        errorMessage: typeof safeContext.errorMessage === "string" && safeContext.errorMessage.trim() !== ""
            ? safeContext.errorMessage
            : null
    };
}

function resolveFeedbackPanelCopy(feedbackPanelStatus, normalizedFeedback, submissionState) {
    switch (feedbackPanelStatus) {
        case "submitting":
            return normalizedFeedback.status === "guided"
                ? "The retry panel keeps the last evaluated guidance visible while the next attempt is in flight."
                : "The retry panel is already reserving exercise context for the in-flight submission so the learner does not lose place if the attempt fails.";
        case "guided":
            return "The current exercise context stays pinned after a failed evaluation while retry eligibility and hint level stay synchronized with the latest boundary payload.";
        case "request-failure":
            return normalizedFeedback.status === "guided"
                ? "The request failed, but the last evaluated retry guidance stays visible so the learner can recover without losing place."
                : "The request failed, but the active exercise context and last attempted answer stay visible for recovery.";
        case "resolved":
            return "The retry shell stays mounted after a successful answer and now reflects that no further retry is needed.";
        default:
            return submissionState.status === "ready"
                ? normalizedFeedback.explanation.message
                : "Retry guidance, explanation copy, and hint progression will stay mounted here after an evaluated submission.";
    }
}

function resolveFeedbackPanelTone(feedbackPanelStatus, normalizedFeedback, submissionState) {
    if (feedbackPanelStatus === "request-failure" || submissionState.status === "retryable-error") {
        return "retryable";
    }

    if (submissionState.status === "terminal-error") {
        return "terminal";
    }

    if (feedbackPanelStatus === "guided") {
        if (normalizedFeedback.explanation.tone === "unsupported") {
            return "unsupported";
        }

        if (normalizedFeedback.explanation.tone === "incorrect") {
            return "incorrect";
        }
    }

    return "ready";
}

function resolveFeedbackPanelBadge(feedbackPanelStatus, normalizedFeedback, submissionState) {
    if (feedbackPanelStatus === "request-failure") {
        return submissionState.status === "terminal-error" ? "terminal" : "retryable";
    }

    if (feedbackPanelStatus === "submitting") {
        return "holding-context";
    }

    if (feedbackPanelStatus === "resolved") {
        return "resolved";
    }

    return normalizedFeedback.retryState.status;
}

function resolveRetryEligibilityCopy(normalizedFeedback) {
    switch (normalizedFeedback.retryState.eligibility) {
        case "eligible":
            return normalizedFeedback.hint.level === "strong"
                ? "Retry is available now, and the stronger hint tier is already unlocked for the next attempt."
                : "Retry is available now, and the panel is holding the lighter hint tier until another failed attempt unlocks stronger guidance.";
        case "not-needed":
            return normalizedFeedback.status === "resolved"
                ? "No retry is needed because the latest evaluated attempt already completed the exercise."
                : "Retry is idle until the learner receives evaluated feedback.";
        default:
            return "Retry guidance is mounted, but eligibility details are temporarily unavailable.";
    }
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

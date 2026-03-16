import { escapeHtml } from "./render-helpers.js";

export function renderSubmissionDraftSection(state) {
    const draft = normalizeSubmissionDraft(state.submissionDraft);
    const preparedSubmission = draft.preparedSubmission;
    const draftStatus = resolveDraftStatus(draft);

    return `
        <section class="lesson-block lesson-block--supporting">
            <div class="lesson-section__header">
                <span class="control-label">Submission seam</span>
                <h4 class="lesson-block__title">Prepare answer draft</h4>
            </div>
            <p class="panel-copy">
                This local draft flow keeps answer entry and submission shape visible before live session transport and correctness rendering are wired.
            </p>
            <form class="submission-draft__form" data-submission-draft-form>
                <div class="submission-draft__fields">
                    <label class="submission-draft__field">
                        <span class="control-label">Answer type</span>
                        <select name="answerType">
                            <option value="command_text"${draft.answerType === "command_text" ? " selected" : ""}>Command text</option>
                        </select>
                    </label>
                    <label class="submission-draft__field">
                        <span class="control-label">Draft answer</span>
                        <textarea
                            name="answer"
                            rows="4"
                            placeholder="Example: git status"
                        >${escapeHtml(draft.answer)}</textarea>
                    </label>
                </div>
                <div class="submission-draft__hint">
                    <span class="lesson-spotlight__pill">Local draft state: ${escapeHtml(draftStatus)}</span>
                    <span class="lesson-spotlight__pill">Scenario: ${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</span>
                </div>
                ${draft.validationError ? `
                    <div class="submission-draft__notice">
                        <span class="control-label">Draft validation</span>
                        <p class="panel-copy">${escapeHtml(draft.validationError)}</p>
                    </div>
                ` : ""}
                <div class="submission-draft__actions">
                    <button class="scenario-action" type="submit">Prepare submission</button>
                    <button class="scenario-action scenario-action--muted" type="button" data-reset-draft>Reset draft</button>
                </div>
            </form>
            ${preparedSubmission ? renderPreparedSubmission(preparedSubmission) : `
                <div class="submission-draft__notice">
                    <span class="control-label">Prepared payload</span>
                    <p class="panel-copy">The form can already assemble a local submission payload, but the actual session start and POST request land in the next transport task.</p>
                </div>
            `}
        </section>
    `;
}

function renderPreparedSubmission(preparedSubmission) {
    return `
        <div class="submission-draft__notice submission-draft__notice--ready">
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

function normalizeSubmissionDraft(draft) {
    const safeDraft = draft ?? {};
    return {
        answerType: typeof safeDraft.answerType === "string" && safeDraft.answerType.trim() !== ""
            ? safeDraft.answerType
            : "command_text",
        answer: typeof safeDraft.answer === "string" ? safeDraft.answer : "",
        validationError: typeof safeDraft.validationError === "string" && safeDraft.validationError.trim() !== ""
            ? safeDraft.validationError
            : null,
        preparedSubmission: safeDraft.preparedSubmission ?? null
    };
}

function resolveDraftStatus(draft) {
    if (draft.preparedSubmission) {
        return "prepared";
    }

    if (draft.answer.trim()) {
        return "ready";
    }

    return "empty";
}

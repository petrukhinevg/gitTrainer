import { escapeHtml } from "./render-helpers.js";

export function renderSubmissionDraftSection(state) {
    const draft = normalizeSubmissionDraft(state.submissionDraft);
    const preparedSubmission = draft.preparedSubmission;
    const draftStatus = resolveDraftStatus(draft);

    return `
        <section class="lesson-block lesson-block--supporting">
            <div class="lesson-section__header">
                <span class="control-label">Контур отправки</span>
                <h4 class="lesson-block__title">Подготовить черновик ответа</h4>
            </div>
            <p class="panel-copy">
                Здесь можно заранее собрать ответ и проверить форму отправки ещё до подключения полной серверной проверки.
            </p>
            <form class="submission-draft__form" data-submission-draft-form>
                <div class="submission-draft__fields">
                    <label class="submission-draft__field">
                        <span class="control-label">Тип ответа</span>
                        <select name="answerType">
                            <option value="command_text"${draft.answerType === "command_text" ? " selected" : ""}>Текст команды</option>
                        </select>
                    </label>
                    <label class="submission-draft__field">
                        <span class="control-label">Черновик ответа</span>
                        <textarea
                            name="answer"
                            rows="4"
                            placeholder="Например: git status"
                        >${escapeHtml(draft.answer)}</textarea>
                    </label>
                </div>
                <div class="submission-draft__hint">
                    <span class="lesson-spotlight__pill">Состояние черновика: ${escapeHtml(draftStatus)}</span>
                    <span class="lesson-spotlight__pill">Сценарий: ${escapeHtml(state.selectedScenarioSlug ?? "неизвестно")}</span>
                </div>
                ${draft.validationError ? `
                    <div class="submission-draft__notice">
                        <span class="control-label">Проверка черновика</span>
                        <p class="panel-copy">${escapeHtml(draft.validationError)}</p>
                    </div>
                ` : ""}
                <div class="submission-draft__actions">
                    <button class="scenario-action" type="submit">Подготовить отправку</button>
                    <button class="scenario-action scenario-action--muted" type="button" data-reset-draft>Сбросить черновик</button>
                </div>
            </form>
            ${preparedSubmission ? renderPreparedSubmission(preparedSubmission) : `
                <div class="submission-draft__notice">
                    <span class="control-label">Подготовленный ответ</span>
                    <p class="panel-copy">Форма уже собирает данные для отправки, но запуск сессии и настоящий запрос к серверу подключаются следующим шагом.</p>
                </div>
            `}
        </section>
    `;
}

function renderPreparedSubmission(preparedSubmission) {
    return `
        <div class="submission-draft__notice submission-draft__notice--ready">
            <span class="control-label">Подготовленный ответ</span>
            <dl class="result-summary">
                <div>
                    <dt>Сценарий</dt>
                    <dd>${escapeHtml(preparedSubmission.scenarioSlug ?? "неизвестно")}</dd>
                </div>
                <div>
                    <dt>Тип ответа</dt>
                    <dd>${escapeHtml(preparedSubmission.answerType)}</dd>
                </div>
                <div>
                    <dt>Черновик ответа</dt>
                    <dd>${escapeHtml(preparedSubmission.answer)}</dd>
                </div>
                <div>
                    <dt>Подготовлено</dt>
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
        return "подготовлен";
    }

    if (draft.answer.trim()) {
        return "готов";
    }

    return "пусто";
}

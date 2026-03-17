import { renderLessonLane } from "./lesson-layout.js";
import { escapeHtml } from "./render-helpers.js";

export function renderWorkspacePanel(state) {
    if (state.route !== "exercise") {
        return renderPracticeShell({
            viewer: renderPlaceholderViewer(
                "Git-ветки",
                "Откройте задание слева, чтобы загрузить представление веток."
            ),
            surface: renderPlaceholderComposer(
                "Команда",
                "Ввод разблокируется после открытия задания."
            )
        });
    }

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return renderPracticeShell({
            viewer: renderPlaceholderViewer(
                "Git-ветки",
                `Загружаем представление веток для ${escapeHtml(state.selectedScenarioSlug ?? "выбранного задания")}.`
            ),
            surface: renderPlaceholderComposer(
                "Команда",
                "Поле ввода остаётся на месте, пока загружаются детали задания."
            )
        });
    }

    if (state.detail.status === "error") {
        return renderPracticeShell({
            viewer: `
                <section class="workspace-card workspace-card--viewer workspace-card--error">
                    <div class="workspace-card__header">
                        <span class="control-label">Git-viewer</span>
                        <span class="workspace-card__badge">ошибка</span>
                    </div>
                    <div class="practice-inline-note">
                        <p class="panel-copy">${escapeHtml(state.detail.error ?? "Неизвестная ошибка деталей сценария")}</p>
                    </div>
                </section>
            `,
            surface: `
                <section class="workspace-card workspace-card--composer workspace-card--focus">
                    <div class="workspace-card__header">
                        <span class="control-label">Practice surface</span>
                        <span class="workspace-card__badge">заблокировано</span>
                    </div>
                    <div class="workspace-card__actions">
                        <a class="scenario-action scenario-action--muted" href="#/catalog">Назад на старт</a>
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
                    <span class="control-label">Git-viewer</span>
                    <span class="workspace-card__badge">${escapeHtml(formatRepositoryStatus(repositoryContext.status))}</span>
                </div>
                <div class="practice-shell__meta practice-shell__meta--viewer">
                    <span class="practice-shell__chip">Текущая ветка: ${escapeHtml(resolveCurrentBranchName(repositoryContext.branches))}</span>
                    <span class="practice-shell__chip">Ветки: ${repositoryContext.branches.length}</span>
                    <span class="practice-shell__chip">Сессия: ${escapeHtml(formatTransportBadge(resolveTransportBadge(bootstrapState, submissionState)))}</span>
                </div>
                <div class="practice-shell__viewer-body">
                    ${renderBranchGraph(repositoryContext.branches)}
                    ${renderViewerStatusStrip(bootstrapState, lifecycle)}
                </div>
            </section>
        `,
        surface: `
            <section class="workspace-card workspace-card--composer workspace-card--focus practice-composer">
                <div class="workspace-card__header">
                    <span class="control-label">Ввод ответа</span>
                    <span class="workspace-card__badge">${escapeHtml(formatTransportBadge(resolveDraftBadge(state.submissionDraft, submissionState)))}</span>
                </div>
                ${renderPracticeScenarioSummary(detail, state.selectedScenarioSlug, state.submissionDraft, lifecycle)}
                ${renderBootstrapNotice(bootstrapState)}
                <form class="practice-composer__form" data-submission-draft-form>
                    <div class="practice-composer__controls">
                        <label class="practice-select">
                            <span class="control-label">Тип ответа</span>
                            <select name="answerType"${submissionState.status === "pending" ? " disabled" : ""}>
                                <option value="command_text"${resolveSelectedAnswerType(state.submissionDraft, "command_text")}>Текст команды</option>
                                <option value="file_patch"${resolveSelectedAnswerType(state.submissionDraft, "file_patch")}>Предпросмотр патча</option>
                            </select>
                        </label>
                    </div>
                    <label class="practice-editor">
                        <span class="practice-editor__prompt">&gt;</span>
                        <textarea name="answer" rows="4" placeholder="Например: git status"${submissionState.status === "pending" ? " disabled" : ""}>${escapeHtml(state.submissionDraft.answer ?? "")}</textarea>
                    </label>
                    <div class="practice-composer__actions">
                        <button class="practice-action practice-action--primary" type="submit"${submitDisabled ? " disabled" : ""}>${escapeHtml(resolvePrimaryActionLabel(bootstrapState, submissionState))}</button>
                        <button class="practice-action" type="button" data-reset-submission-draft${resetDisabled ? " disabled" : ""}>Сбросить черновик</button>
                    </div>
                </form>
                ${state.submissionDraft.validationError ? `
                    <div class="practice-inline-note">
                        <p class="panel-copy">${escapeHtml(state.submissionDraft.validationError)}</p>
                    </div>
                ` : ""}
                <div class="practice-composer__results">
                    ${renderSubmissionTransportOutput(
                        state.submissionDraft.preparedSubmission,
                        submissionState,
                        bootstrapState.response?.submission?.supportedAnswerTypes ?? []
                    )}
                    ${renderRetryFeedbackPanel(feedbackPanelState, retryFeedback, submissionState)}
                </div>
            </section>
        `
    });
}

function renderPracticeShell({ viewer, surface }) {
    return renderLessonLane({
        lane: "practice",
        label: "Практика",
        title: "Git-viewer и ввод команды",
        description: "Правая колонка держит viewer наверху и компактную practice-surface внизу.",
        showHeader: false,
        body: `
            <div class="practice-stack">
                <div class="practice-pane practice-pane--viewer">${viewer}</div>
                <div class="practice-pane practice-pane--surface">${surface}</div>
            </div>
        `
    });
}

function renderPlaceholderViewer(title, copy) {
    return `
        <section class="workspace-card workspace-card--viewer">
            <div class="workspace-card__header">
                <span class="control-label">${escapeHtml(title)}</span>
                <span class="workspace-card__badge">ожидание</span>
            </div>
            <div class="practice-inline-note practice-inline-note--viewer">
                <p class="panel-copy">${escapeHtml(copy)}</p>
            </div>
            <div class="branch-graph branch-graph--placeholder" aria-hidden="true">
                <div class="branch-graph__row">
                    <span class="branch-graph__node"></span>
                    <span class="branch-graph__track"></span>
                    <div class="branch-graph__label">
                        <strong>main</strong>
                        <span>ждём контекст задания</span>
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
                <span class="workspace-card__badge">ожидание</span>
            </div>
            <div class="practice-summary">
                <p class="panel-copy">${escapeHtml(copy)}</p>
            </div>
            <label class="practice-editor">
                <span class="practice-editor__prompt">&gt;</span>
                <textarea rows="4" placeholder="Например: git status" disabled></textarea>
            </label>
            <div class="practice-output">
                <span class="control-label">Каркас вывода</span>
                <p class="panel-copy">Подготовленный payload и транспортная обратная связь появятся здесь после открытия сценария.</p>
            </div>
        </section>
    `;
}

function renderPracticeScenarioSummary(detail, selectedScenarioSlug, submissionDraft, lifecycle) {
    const title = typeof detail?.title === "string" && detail.title.trim() !== ""
        ? detail.title
        : selectedScenarioSlug ?? "Активное упражнение";
    const summary = typeof detail?.summary === "string" && detail.summary.trim() !== ""
        ? detail.summary
        : "Сценарное summary появится после загрузки authored detail payload.";
    const goal = typeof detail?.workspace?.task?.goal === "string" && detail.workspace.task.goal.trim() !== ""
        ? detail.workspace.task.goal
        : null;
    const difficulty = typeof detail?.difficulty === "string" && detail.difficulty.trim() !== ""
        ? detail.difficulty
        : "mvp";

    return `
        <div class="practice-summary">
            <div class="practice-summary__header">
                <div class="practice-summary__heading">
                    <h3 class="practice-summary__title">${escapeHtml(title)}</h3>
                    <p class="panel-copy practice-summary__lead">${escapeHtml(goal ?? summary)}</p>
                </div>
                <div class="practice-shell__meta practice-shell__meta--compact">
                    <span class="practice-shell__chip">Тип: ${escapeHtml(resolveActiveAnswerType(submissionDraft))}</span>
                    <span class="practice-shell__chip">Уровень: ${escapeHtml(difficulty)}</span>
                    <span class="practice-shell__chip">Попытки: ${escapeHtml(String(lifecycle?.submissionCount ?? 0))}</span>
                </div>
            </div>
            ${goal && goal !== summary ? `
                <div class="practice-inline-note">
                    <p class="panel-copy">${escapeHtml(summary)}</p>
                </div>
            ` : ""}
        </div>
    `;
}

function renderViewerStatusStrip(bootstrapState, lifecycle) {
    if (bootstrapState.status === "pending") {
        return renderViewerStateBlock({
            label: "Сессия запускается",
            status: "pending",
            badge: "pending",
            copy: "Поднимаем transport для первой отправки."
        });
    }

    if (bootstrapState.status === "retryable-error") {
        return renderViewerStateBlock({
            label: "Сессию можно перезапустить",
            status: "retryable",
            badge: "retryable",
            copy: bootstrapState.error?.message ?? "Не удалось запустить сессию.",
            actions: `
                <button class="practice-action practice-action--primary" type="button" data-session-request-retry="bootstrap">Повторить запуск</button>
            `
        });
    }

    if (bootstrapState.status === "terminal-error") {
        return renderViewerStateBlock({
            label: "Сессия недоступна",
            status: "terminal",
            badge: "terminal",
            copy: bootstrapState.error?.message ?? "Сессию не удалось запустить."
        });
    }

    if (bootstrapState.status !== "ready" || !bootstrapState.response) {
        return renderViewerStateBlock({
            label: "Сессия ожидает запуск",
            status: "idle",
            badge: "idle",
            copy: "Transport поднимется автоматически после открытия упражнения."
        });
    }

    return `
        <div class="viewer-status-strip viewer-status-strip--ready">
            <div class="viewer-status-strip__header">
                <span class="control-label">Сессия активна</span>
                <span class="workspace-card__badge">${escapeHtml(formatTransportBadge(lifecycle?.status ?? bootstrapState.response.lifecycle?.status ?? "active"))}</span>
            </div>
            <div class="viewer-status-strip__meta">
                <span class="viewer-status-strip__item">Отправки: ${escapeHtml(String(lifecycle?.submissionCount ?? bootstrapState.response.lifecycle?.submissionCount ?? 0))}</span>
                <span class="viewer-status-strip__item">Типы: ${escapeHtml((bootstrapState.response.submission?.supportedAnswerTypes ?? []).map(formatAnswerType).join(", ") || "неизвестно")}</span>
            </div>
        </div>
    `;
}

function renderViewerStateBlock({ label, status, badge, copy, actions = "" }) {
    return `
        <div class="viewer-status-strip viewer-status-strip--${escapeHtml(status)}">
            <div class="viewer-status-strip__header">
                <span class="control-label">${escapeHtml(label)}</span>
                <span class="workspace-card__badge">${escapeHtml(badge)}</span>
            </div>
            <p class="panel-copy">${escapeHtml(copy)}</p>
            ${actions ? `<div class="viewer-status-strip__actions">${actions}</div>` : ""}
        </div>
    `;
}

function renderBootstrapNotice(bootstrapState) {
    if (bootstrapState.status === "pending") {
        return `
            <div class="practice-request practice-request--pending">
                <span class="control-label">Состояние запроса</span>
                <p class="panel-copy">Запускаем сессию для этого сценария. Отправка откроется, когда транспорт будет готов.</p>
            </div>
        `;
    }

    if (bootstrapState.status === "retryable-error") {
        return `
            <div class="practice-request practice-request--retryable">
                <span class="control-label">Состояние запроса</span>
                <p class="panel-copy">${escapeHtml(bootstrapState.error?.message ?? "Не удалось запустить сессию.")}</p>
                <div class="practice-output__actions">
                    <button class="practice-action practice-action--primary" type="button" data-session-request-retry="bootstrap">Повторить запуск сессии</button>
                </div>
            </div>
        `;
    }

    if (bootstrapState.status === "terminal-error") {
        return `
            <div class="practice-request practice-request--terminal">
                <span class="control-label">Состояние запроса</span>
                <p class="panel-copy">${escapeHtml(bootstrapState.error?.message ?? "Сессию не удалось запустить.")}</p>
            </div>
        `;
    }

    return "";
}

function renderSubmissionTransportOutput(preparedSubmission, submissionState, supportedAnswerTypes) {
    if (submissionState.status === "pending") {
        return renderSubmissionRequestBlock({
            label: "Транспорт отправки",
            status: "pending",
            badge: "pending",
            copy: "Отправляем подготовленный ответ через активную сессию.",
            payload: submissionState.lastPayload
        });
    }

    if (submissionState.status === "retryable-error") {
        return renderSubmissionRequestBlock({
            label: "Транспорт отправки",
            status: "retryable",
            badge: "retryable",
            copy: submissionState.error?.message ?? "Отправка не удалась, но её можно повторить.",
            payload: submissionState.lastPayload,
            actions: `
                <button class="practice-action practice-action--primary" type="button" data-session-request-retry="submission">Повторить отправку</button>
            `
        });
    }

    if (submissionState.status === "terminal-error") {
        return renderSubmissionRequestBlock({
            label: "Транспорт отправки",
            status: "terminal",
            badge: "terminal",
            copy: submissionState.error?.message ?? "Отправка завершилась ошибкой.",
            payload: submissionState.lastPayload,
            actions: `
                <button class="practice-action practice-action--primary" type="button" data-session-request-restart>Начать новую сессию</button>
            `
        });
    }

    if (submissionState.status === "ready" && submissionState.response) {
        const outcome = submissionState.response.outcome ?? null;
        return `
            ${renderCorrectnessFeedbackBlock(submissionState.response, supportedAnswerTypes)}
            <div class="practice-output practice-output--ready">
                <div class="practice-output__header">
                    <span class="control-label">Квитанция отправки</span>
                    <span class="workspace-card__badge">${escapeHtml(formatCorrectness(resolveSubmissionReceiptBadge(outcome)))}</span>
                </div>
                <dl class="result-summary">
                    <div>
                        <dt>ID отправки</dt>
                        <dd>${escapeHtml(submissionState.response.submissionId)}</dd>
                    </div>
                    <div>
                        <dt>Попытка</dt>
                        <dd>${escapeHtml(String(submissionState.response.attemptNumber))}</dd>
                    </div>
                    <div>
                        <dt>Отправлено</dt>
                        <dd>${escapeHtml(submissionState.response.submittedAt)}</dd>
                    </div>
                    <div>
                        <dt>Тип ответа</dt>
                        <dd>${escapeHtml(formatAnswerType(submissionState.response.answer?.type ?? "unknown"))}</dd>
                    </div>
                    <div>
                        <dt>Значение ответа</dt>
                        <dd>${escapeHtml(submissionState.response.answer?.value ?? "")}</dd>
                    </div>
                </dl>
                <p class="panel-copy">Транспорт завершён, а результат проверки уже показан выше.</p>
            </div>
        `;
    }

    if (preparedSubmission) {
        return `
            <div class="practice-output practice-output--ready">
                <span class="control-label">Подготовленный payload</span>
                ${renderPreparedPayloadSummary(preparedSubmission)}
                <p class="panel-copy">Ответ готов к отправке, как только активная сессия станет доступна.</p>
            </div>
        `;
    }

    return `
        <div class="practice-output">
            <span class="control-label">Транспорт отправки</span>
            <p class="panel-copy">Транспортная обратная связь появится здесь после принятия ответа активной сессией.</p>
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
                <dt>Сценарий</dt>
                <dd>${escapeHtml(preparedSubmission.scenarioSlug ?? "неизвестно")}</dd>
            </div>
            <div>
                <dt>Тип ответа</dt>
                <dd>${escapeHtml(formatAnswerType(preparedSubmission.answerType))}</dd>
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
    `;
}

function renderRetryFeedbackPanel(feedbackPanelState, retryFeedback, submissionState) {
    const normalizedFeedback = normalizeRetryFeedback(retryFeedback);
    const preservedContext = normalizeFeedbackContextSnapshot(feedbackPanelState.contextSnapshot);
    const copy = resolveFeedbackPanelCopy(feedbackPanelState.status, normalizedFeedback, submissionState);
    const tone = resolveFeedbackPanelTone(feedbackPanelState.status, normalizedFeedback, submissionState);
    const revealedHints = normalizedFeedback.hint.reveals.slice(0, feedbackPanelState.revealedHintCount);
    const nextHint = normalizedFeedback.hint.reveals[feedbackPanelState.revealedHintCount] ?? null;
    const compactGoal = truncateInlineCopy(preservedContext.goal, 120);
    const compactAnswer = truncateInlineCopy(preservedContext.answer, 72);

    return `
        <div class="practice-output practice-output--${escapeHtml(tone)}" data-retry-feedback-panel data-retry-feedback-status="${escapeHtml(normalizedFeedback.status)}">
            <div class="practice-output__header">
                <span class="control-label">Обратная связь для повтора</span>
                <span class="workspace-card__badge">${escapeHtml(formatRetryFeedbackBadge(resolveFeedbackPanelBadge(feedbackPanelState.status, normalizedFeedback, submissionState)))}</span>
            </div>
            <p class="panel-copy">${escapeHtml(copy)}</p>
            <div class="practice-feedback__context" data-retry-context-summary>
                <div class="practice-feedback__meta practice-feedback__meta--dense">
                    <span class="practice-feedback__pill">Сценарий: ${escapeHtml(preservedContext.scenarioTitle)}</span>
                    <span class="practice-feedback__pill">Ветка: ${escapeHtml(preservedContext.currentBranch)}</span>
                    <span class="practice-feedback__pill">Тип: ${escapeHtml(formatAnswerType(preservedContext.answerType))}</span>
                    <span class="practice-feedback__pill">Транспорт: ${escapeHtml(formatTransportBadge(preservedContext.transportDisposition))}</span>
                </div>
                <p class="panel-copy practice-feedback__context-copy">Цель: ${escapeHtml(compactGoal)}</p>
                ${compactAnswer ? `
                    <p class="panel-copy practice-feedback__context-copy">Последний ответ: ${escapeHtml(compactAnswer)}</p>
                ` : ""}
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
                            <p class="panel-copy">Ответ близок, но команде всё ещё не хватает точности.</p>
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
                    <span class="practice-feedback__pill" data-retry-state-status="${escapeHtml(normalizedFeedback.retryState.status)}">Попытка: ${escapeHtml(String(normalizedFeedback.retryState.attemptNumber))}</span>
                    <span class="practice-feedback__pill" data-retry-eligibility="${escapeHtml(normalizedFeedback.retryState.eligibility)}">Допуск: ${escapeHtml(formatRetryEligibility(normalizedFeedback.retryState.eligibility))}</span>
                    <span class="practice-feedback__pill" data-retry-hint-level="${escapeHtml(normalizedFeedback.hint.level)}">Уровень подсказки: ${escapeHtml(formatHintLevel(normalizedFeedback.hint.level))}</span>
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
                <span class="control-label">Обратная связь по корректности</span>
                <p class="panel-copy">Отправка завершена, но результат проверки пока недоступен.</p>
            </div>
        `;
    }

    const correctness = normalizeOutcomeCorrectness(outcome.correctness);
    const tone = resolveOutcomeTone(correctness);
    const supportedTypesCopy = supportedAnswerTypes.length ? supportedAnswerTypes.map(formatAnswerType).join(", ") : "Текст команды";

    return `
        <div class="practice-output practice-output--${escapeHtml(tone)}">
            <div class="practice-output__header">
                <span class="control-label">Обратная связь по корректности</span>
                <span class="workspace-card__badge">${escapeHtml(formatCorrectness(correctness))}</span>
            </div>
            <div class="practice-feedback">
                <div class="practice-feedback__summary">
                    <h4 class="practice-feedback__title">${escapeHtml(resolveOutcomeTitle(correctness))}</h4>
                    <p class="panel-copy">${escapeHtml(outcome.message ?? "Сообщение о результате недоступно.")}</p>
                </div>
                <div class="practice-feedback__meta">
                    <span class="practice-feedback__pill">Попытка: ${escapeHtml(String(submissionResponse.attemptNumber ?? "?"))}</span>
                    <span class="practice-feedback__pill">Тип: ${escapeHtml(formatAnswerType(submissionResponse.answer?.type ?? "unknown"))}</span>
                    <span class="practice-feedback__pill">Код: ${escapeHtml(outcome.code ?? "неизвестно")}</span>
                </div>
                ${correctness === "unsupported" ? `
                    <div class="practice-inline-note practice-inline-note--warning">
                        <p class="panel-copy">
                            Сейчас эта сессия поддерживает: ${escapeHtml(supportedTypesCopy)}.
                            Верните тип ответа к поддерживаемому значению и отправьте снова.
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
                    <span class="control-label">Пустое состояние</span>
                    <p class="panel-copy">В активном payload деталей нет подсказок по веткам.</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="branch-graph" aria-label="Схема Git-веток">
            ${branches.map((branch, index) => `
                <article class="branch-graph__row ${branch.current ? "branch-graph__row--current" : ""}">
                    <span class="branch-graph__node"></span>
                    <span class="branch-graph__track ${index === branches.length - 1 ? "branch-graph__track--last" : ""}"></span>
                    <div class="branch-graph__label">
                        <strong>${escapeHtml(branch.name)}</strong>
                        <span>${branch.current ? "текущая ветка" : "доступная ветка"}</span>
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

function resolveCurrentBranchName(branches) {
    const currentBranch = Array.isArray(branches)
        ? branches.find((branch) => branch?.current)
        : null;

    return typeof currentBranch?.name === "string" && currentBranch.name.trim() !== ""
        ? currentBranch.name
        : "неизвестно";
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
                : "Подсказка для повтора",
            tone: typeof explanation.tone === "string" && explanation.tone.trim() !== ""
                ? explanation.tone
                : "neutral",
            message: typeof explanation.message === "string" && explanation.message.trim() !== ""
                ? explanation.message
                : "Подсказка для повтора появится здесь после первой проверенной отправки.",
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
                : "Прогресс подсказок остаётся в ожидании, пока пользователь не получит проверенную обратную связь.",
            reveals: Array.isArray(hint.reveals)
                ? hint.reveals
                    .filter((item) => item && typeof item === "object")
                    .map((item, index) => ({
                        id: typeof item.id === "string" && item.id.trim() !== ""
                            ? item.id
                            : `hint-${index + 1}`,
                        label: typeof item.label === "string" && item.label.trim() !== ""
                            ? item.label
                            : "Показать подсказку",
                        title: typeof item.title === "string" && item.title.trim() !== ""
                            ? item.title
                            : "Подсказка",
                        message: typeof item.message === "string" && item.message.trim() !== ""
                            ? item.message
                            : "Дополнительная подсказка недоступна."
                    }))
                : []
        }
    };
}

function truncateInlineCopy(value, limit = 96) {
    if (typeof value !== "string") {
        return "";
    }

    const normalized = value.trim();
    if (normalized === "") {
        return "";
    }

    if (normalized.length <= limit) {
        return normalized;
    }

    return `${normalized.slice(0, limit - 1).trimEnd()}…`;
}

function normalizeFeedbackContextSnapshot(contextSnapshot) {
    const safeContext = contextSnapshot ?? {};
    return {
        scenarioTitle: typeof safeContext.scenarioTitle === "string" && safeContext.scenarioTitle.trim() !== ""
            ? safeContext.scenarioTitle
            : "Активное упражнение",
        goal: typeof safeContext.goal === "string" && safeContext.goal.trim() !== ""
            ? safeContext.goal
            : "Контекст повтора остаётся привязанным к текущему упражнению.",
        currentBranch: typeof safeContext.currentBranch === "string" && safeContext.currentBranch.trim() !== ""
            ? safeContext.currentBranch
            : "неизвестно",
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
                ? "Панель повтора сохраняет последнюю проверенную подсказку, пока новая попытка отправляется."
                : "Панель повтора уже держит контекст упражнения, чтобы пользователь не потерял место, если попытка завершится ошибкой.";
        case "guided":
            return "Контекст текущего упражнения остаётся закреплён после неудачной проверки, а допуск к повтору и уровень подсказки синхронизируются с последним payload.";
        case "request-failure":
            return normalizedFeedback.status === "guided"
                ? "Запрос завершился ошибкой, но последняя проверенная подсказка для повтора остаётся видимой, чтобы можно было восстановиться без потери контекста."
                : "Запрос завершился ошибкой, но контекст активного упражнения и последний ответ остаются видимыми для восстановления.";
        case "resolved":
            return "Панель повтора остаётся на месте после успешного ответа и показывает, что новый повтор уже не нужен.";
        default:
            return submissionState.status === "ready"
                ? normalizedFeedback.explanation.message
                : "Подсказки для повтора, объяснение и прогресс подсказок появятся здесь после проверенной отправки.";
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
                ? "Повтор уже доступен, и усиленный уровень подсказки открыт для следующей попытки."
                : "Повтор уже доступен, а панель пока держит более мягкую подсказку до следующей неудачной попытки.";
        case "not-needed":
            return normalizedFeedback.status === "resolved"
                ? "Повтор не нужен, потому что последняя проверенная попытка уже завершила упражнение."
                : "Повтор остаётся в ожидании, пока пользователь не получит проверенную обратную связь.";
        default:
            return "Панель повтора уже смонтирована, но детали допуска временно недоступны.";
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
        return "Отправка...";
    }

    if (bootstrapState.status === "pending") {
        return "Запуск сессии...";
    }

    if (bootstrapState.status === "retryable-error") {
        return "Сначала повторите запуск сессии";
    }

    if (bootstrapState.status === "terminal-error") {
        return "Сессия недоступна";
    }

    if (bootstrapState.status === "ready") {
        return "Отправить ответ";
    }

    return "Подготовка сессии...";
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
    return submissionDraft?.answerType === "file_patch" ? "предпросмотр патча" : "текст команды";
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
            return "Верный следующий шаг";
        case "incorrect":
            return "Это не ожидаемая команда";
        case "unsupported":
            return "Неподдерживаемый тип ответа";
        default:
            return "Ответ принят";
    }
}

function resolveSubmissionReceiptBadge(outcome) {
    return normalizeOutcomeCorrectness(outcome?.correctness);
}

function resolveSubmissionBoundaryCopy(submissionBoundary) {
    const placeholderOutcome = submissionBoundary?.placeholderOutcome ?? null;
    const boundaryMessage = typeof placeholderOutcome?.message === "string" && placeholderOutcome.message.trim() !== ""
        ? placeholderOutcome.message
        : "Транспорт сессии готов к первой проверяемой отправке.";
    const supportedTypesCopy = Array.isArray(submissionBoundary?.supportedAnswerTypes)
        ? submissionBoundary.supportedAnswerTypes.map(formatAnswerType).join(", ")
        : "";

    if (!supportedTypesCopy) {
        return boundaryMessage;
    }

    return `${boundaryMessage} Поддерживаемые типы ответов: ${supportedTypesCopy}.`;
}

function formatRepositoryStatus(value) {
    switch (value) {
        case "authored-fixture":
            return "фикстура";
        case "unavailable":
            return "недоступно";
        default:
            return value ?? "неизвестно";
    }
}

function formatTransportBadge(value) {
    switch (value) {
        case "idle":
            return "ожидание";
        case "pending":
            return "в процессе";
        case "retryable":
            return "можно повторить";
        case "terminal":
            return "критическая ошибка";
        case "submitting":
            return "отправка";
        case "correct":
            return "верно";
        case "incorrect":
            return "ошибка";
        case "unsupported":
            return "не поддерживается";
        case "partial":
            return "частично";
        case "submitted":
            return "отправлено";
        case "active":
            return "активна";
        case "booting":
            return "запуск";
        case "prepared":
            return "подготовлено";
        case "draft":
            return "черновик";
        default:
            return value ?? "неизвестно";
    }
}

function formatRetryFeedbackBadge(value) {
    switch (value) {
        case "idle":
            return "ожидание";
        case "guided":
            return "с подсказкой";
        case "resolved":
            return "завершено";
        case "placeholder":
            return "ожидание";
        case "request-failure":
            return "ошибка запроса";
        case "holding-context":
            return "контекст сохранён";
        case "retry-available":
            return "повтор доступен";
        case "complete":
            return "завершено";
        case "evaluated":
            return "проверено";
        default:
            return formatTransportBadge(value);
    }
}

function formatRetryEligibility(value) {
    switch (value) {
        case "eligible":
            return "можно повторить";
        case "not-needed":
            return "не требуется";
        default:
            return value ?? "неизвестно";
    }
}

function formatHintLevel(value) {
    switch (value) {
        case "baseline":
            return "базовый";
        case "nudge":
            return "намёк";
        case "strong":
            return "усиленный";
        case "none":
            return "не нужен";
        default:
            return value ?? "неизвестно";
    }
}

function formatExplanationTone(value) {
    switch (value) {
        case "neutral":
            return "нейтральный";
        case "success":
            return "успех";
        case "unsupported":
            return "неподдерживаемый";
        case "incorrect":
            return "ошибка";
        case "partial":
            return "частичное совпадение";
        case "correct":
            return "верный";
        default:
            return value ?? "неизвестно";
    }
}

function formatAnswerType(value) {
    switch (value) {
        case "command_text":
            return "Текст команды";
        case "file_patch":
            return "Предпросмотр патча";
        default:
            return value ?? "неизвестно";
    }
}

function formatCorrectness(value) {
    switch (value) {
        case "correct":
            return "верно";
        case "incorrect":
            return "ошибка";
        case "unsupported":
            return "не поддерживается";
        case "partial":
            return "частично";
        case "submitted":
            return "отправлено";
        default:
            return value ?? "неизвестно";
    }
}

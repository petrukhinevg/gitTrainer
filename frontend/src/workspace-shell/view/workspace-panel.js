import { renderLessonLane } from "./lesson-layout.js";
import {
    escapeHtml,
    formatDifficulty
} from "./render-helpers.js";

export function renderWorkspacePanel(state) {
    return renderPracticeShell(
        renderWorkspacePanelSections(state),
        resolveWorkspacePanelAccentTag(state)
    );
}

export function renderWorkspacePanelSections(state) {
    if (state.route !== "exercise") {
        return {
            viewer: renderPlaceholderViewer(
                "Git-ветки",
                "Откройте задание слева, чтобы загрузить представление веток."
            ),
            surface: renderPlaceholderComposer(
                "Команда",
                "Ввод разблокируется после открытия задания."
            )
        };
    }

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return {
            viewer: renderPlaceholderViewer(
                "Git-ветки",
                `Загружаем представление веток для ${escapeHtml(state.selectedScenarioSlug ?? "выбранного задания")}.`
            ),
            surface: renderPlaceholderComposer(
                "Команда",
                "Поле ввода остаётся на месте, пока загружаются детали задания."
            )
        };
    }

    if (state.detail.status === "error") {
        return {
            viewer: `
                <section class="workspace-card workspace-card--viewer workspace-card--error">
                    <div class="workspace-card__header">
                        <span class="control-label">Состояние репозитория</span>
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
                        <span class="control-label">Область практики</span>
                        <span class="workspace-card__badge">заблокировано</span>
                    </div>
                    <div class="practice-composer__scroll" data-practice-surface-scroll>
                        <div class="workspace-card__actions">
                            <a class="scenario-action scenario-action--muted" href="#/catalog">Назад на старт</a>
                        </div>
                    </div>
                </section>
            `
        };
    }

    const detail = state.detail.data;
    const bootstrapState = normalizeBootstrapState(state.session?.bootstrap);
    const submissionState = normalizeSubmissionState(state.session?.submission);
    const feedbackPanelState = normalizeFeedbackPanelState(state.session?.feedbackPanel);
    const repositoryContext = normalizeRepositoryContext(resolveActiveRepositoryContext(
        detail,
        bootstrapState,
        submissionState
    ));
    const workspacePlayback = normalizeWorkspacePlayback(
        state.session?.workspacePlayback
    );
    const viewerRepositoryContext = resolveViewerRepositoryContext(
        repositoryContext,
        workspacePlayback
    );
    const commandHistory = normalizeCommandHistory(state.session?.commandHistory);
    const lifecycle = submissionState.response?.lifecycle ?? bootstrapState.response?.lifecycle ?? null;
    const retryFeedback = resolveRetryFeedback(feedbackPanelState, bootstrapState, submissionState);
    const submitDisabled = isSubmitDisabled(bootstrapState, submissionState);
    const resetDisabled = bootstrapState.status === "pending" || submissionState.status === "pending";
    const accentTag = resolveWorkspacePanelAccentTag(state);

    return {
        viewer: `
            <div class="practice-shell__viewer-body practice-shell__viewer-body--plain">
                <div class="practice-repository-viewer" data-repository-context>
                    ${renderRepositoryWorkspaceCanvas(viewerRepositoryContext, workspacePlayback)}
                    ${renderWorkspaceTerminal({
            scenarioTitle: detail.title,
            accentTag,
            submissionDraft: state.submissionDraft,
            bootstrapState,
            submissionState,
            workspacePlayback,
            repositoryContext,
            commandHistory,
            submitDisabled,
            resetDisabled
        })}
                </div>
            </div>
        `,
        surface: `
            <section class="workspace-card workspace-card--composer workspace-card--focus practice-composer" data-practice-surface-scroll>
                <details class="practice-composer__spoiler" data-practice-surface-spoiler>
                    <summary class="practice-composer__spoiler-summary">Показать контекст, результат и подсказки</summary>
                    <div class="practice-composer__spoiler-body">
                        <div class="practice-composer__scroll practice-composer__scroll--surface">
                            ${renderPracticeScenarioSummary(detail, state.selectedScenarioSlug, state.submissionDraft, lifecycle)}
                            ${renderBootstrapNotice(bootstrapState)}
                            ${renderPracticeRepositorySupplement(
                                repositoryContext,
                                workspacePlayback,
                                bootstrapState,
                                submissionState,
                                lifecycle
                            )}
                            ${renderSubmissionTransportOutput(
                                state.submissionDraft.preparedSubmission,
                                submissionState,
                                bootstrapState.response?.submission?.supportedAnswerTypes ?? []
                            )}
                            ${renderRetryFeedbackPanel(feedbackPanelState, retryFeedback, submissionState)}
                        </div>
                    </div>
                </details>
            </section>
        `
    };
}

function renderPracticeShell({ viewer, surface }, accentTag = null) {
    return renderLessonLane({
        lane: "practice",
        label: "Практика",
        title: "Состояние репозитория и ввод команды",
        description: "Справа сверху показывается commit tree и терминал, ниже остаются контекст упражнения и результат отправки.",
        showHeader: false,
        body: `
            <div class="practice-stack"${accentTag ? ` data-workspace-active-tag="${escapeHtml(accentTag)}"` : ""}>
                <div class="practice-pane practice-pane--viewer">${viewer}</div>
                <div class="practice-pane practice-pane--surface">${surface}</div>
            </div>
        `
    });
}

export function resolveWorkspacePanelAccentTag(state) {
    const activeTag = normalizeWorkspaceTagToken(state?.heldNavigationTag ?? state?.pinnedNavigationTag);
    if (!activeTag) {
        return null;
    }

    const scenarioTags = Array.isArray(state?.detail?.data?.tags)
        ? state.detail.data.tags.map(normalizeWorkspaceTagToken).filter(Boolean)
        : [];

    return scenarioTags.includes(activeTag) ? activeTag : null;
}

function normalizeWorkspaceTagToken(tag) {
    return typeof tag === "string" && tag.trim() !== ""
        ? tag.trim().toLowerCase()
        : null;
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
            <div class="practice-composer__primary">
                <label class="practice-editor">
                    <span class="practice-editor__prompt">&gt;</span>
                    <textarea rows="4" placeholder="Например: git status" disabled></textarea>
                </label>
            </div>
            <div class="practice-composer__scroll" data-practice-surface-scroll>
                <div class="practice-summary">
                    <p class="panel-copy">${escapeHtml(copy)}</p>
                </div>
                <div class="practice-output">
                    <span class="control-label">Каркас вывода</span>
                    <p class="panel-copy">Подготовленный ответ и результат отправки появятся здесь после открытия сценария.</p>
                </div>
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
        : "Краткое описание сценария появится после загрузки данных задания.";
    const goal = typeof detail?.workspace?.task?.goal === "string" && detail.workspace.task.goal.trim() !== ""
        ? detail.workspace.task.goal
        : null;
    const difficulty = typeof detail?.difficulty === "string" && detail.difficulty.trim() !== ""
        ? formatDifficulty(detail.difficulty)
        : "Неизвестно";

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
            copy: "Подготавливаем сеанс для первой отправки."
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
            copy: "Сеанс запустится автоматически после открытия упражнения."
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
                <p class="panel-copy">Запускаем сессию для этого сценария. Отправка станет доступна, когда всё будет готово.</p>
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
            label: "Отправка ответа",
            status: "pending",
            badge: "pending",
            copy: "Отправляем ответ через активную сессию.",
            payload: submissionState.lastPayload
        });
    }

    if (submissionState.status === "retryable-error") {
        return renderSubmissionRequestBlock({
            label: "Отправка ответа",
            status: "retryable",
            badge: "retryable",
            copy: "Отправка не удалась, но её можно повторить. Подробности уже показаны в консоли выше.",
            payload: submissionState.lastPayload,
            actions: `
                <button class="practice-action practice-action--primary" type="button" data-session-request-retry="submission">Повторить отправку</button>
            `
        });
    }

    if (submissionState.status === "terminal-error") {
        return renderSubmissionRequestBlock({
            label: "Отправка ответа",
            status: "terminal",
            badge: "terminal",
            copy: "Отправка завершилась ошибкой. Подробности уже показаны в консоли выше.",
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
                    <span class="control-label">Сведения об отправке</span>
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
                <p class="panel-copy">Ответ отправлен, а результат проверки уже показан выше.</p>
            </div>
        `;
    }

    if (preparedSubmission) {
        return `
            <div class="practice-output practice-output--ready">
                <span class="control-label">Подготовленный ответ</span>
                ${renderPreparedPayloadSummary(preparedSubmission)}
                <p class="panel-copy">Ответ готов к отправке, как только активная сессия станет доступна.</p>
            </div>
        `;
    }

    return `
        <div class="practice-output">
            <span class="control-label">Отправка ответа</span>
            <p class="panel-copy">Здесь появится информация об отправке, как только активная сессия примет ответ.</p>
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
                <dt>Ответ</dt>
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
    const hasExplanationDetails = normalizedFeedback.explanation.details.length > 0 || normalizedFeedback.explanation.tone === "partial";
    const hasHintLayer = normalizedFeedback.hint.message || revealedHints.length || nextHint;

    return `
        <div class="practice-output practice-output--${escapeHtml(tone)}" data-retry-feedback-panel data-retry-feedback-status="${escapeHtml(normalizedFeedback.status)}">
            <div class="practice-output__header">
                <span class="control-label">Обратная связь для повтора</span>
                <span class="workspace-card__badge">${escapeHtml(formatRetryFeedbackBadge(resolveFeedbackPanelBadge(feedbackPanelState.status, normalizedFeedback, submissionState)))}</span>
            </div>
            <p class="panel-copy">${escapeHtml(copy)}</p>
            <div class="practice-feedback">
                <div class="practice-feedback__summary">
                    <h4 class="practice-feedback__title">${escapeHtml(normalizedFeedback.explanation.title)}</h4>
                    <p class="panel-copy" data-retry-explanation>${escapeHtml(normalizedFeedback.explanation.message)}</p>
                </div>
                <div class="practice-feedback__meta">
                    <span class="practice-feedback__pill" data-retry-state-status="${escapeHtml(normalizedFeedback.retryState.status)}">Попытка: ${escapeHtml(String(normalizedFeedback.retryState.attemptNumber))}</span>
                    <span class="practice-feedback__pill" data-retry-eligibility="${escapeHtml(normalizedFeedback.retryState.eligibility)}">Допуск: ${escapeHtml(formatRetryEligibility(normalizedFeedback.retryState.eligibility))}</span>
                    <span class="practice-feedback__pill" data-retry-hint-level="${escapeHtml(normalizedFeedback.hint.level)}">Уровень подсказки: ${escapeHtml(formatHintLevel(normalizedFeedback.hint.level))}</span>
                    <span class="practice-feedback__pill">Объяснение: ${escapeHtml(formatRetryFeedbackBadge(normalizedFeedback.explanation.status))}</span>
                    <span class="practice-feedback__pill">Тон: ${escapeHtml(formatExplanationTone(normalizedFeedback.explanation.tone))}</span>
                </div>
                <div class="practice-inline-note" data-retry-feedback-slot="eligibility">
                    <p class="panel-copy">${escapeHtml(resolveRetryEligibilityCopy(normalizedFeedback))}</p>
                </div>
                <details class="practice-feedback__details">
                    <summary class="practice-feedback__details-summary">Контекст упражнения</summary>
                    <div class="practice-feedback__details-body">
                        <div class="practice-output practice-output--ready" data-retry-context-summary>
                            <dl class="result-summary">
                                <div>
                                    <dt>Сценарий</dt>
                                    <dd>${escapeHtml(preservedContext.scenarioTitle)}</dd>
                                </div>
                                <div>
                                    <dt>Цель</dt>
                                    <dd>${escapeHtml(preservedContext.goal)}</dd>
                                </div>
                                <div>
                                    <dt>Ветка</dt>
                                    <dd>${escapeHtml(preservedContext.currentBranch)}</dd>
                                </div>
                                <div>
                                    <dt>Подсказки репозитория</dt>
                                    <dd>${escapeHtml(`${preservedContext.branchCount} веток, ${preservedContext.fileCount} файлов`)}</dd>
                                </div>
                                <div>
                                    <dt>Последний тип ответа</dt>
                                    <dd>${escapeHtml(formatAnswerType(preservedContext.answerType))}</dd>
                                </div>
                                <div>
                                    <dt>Последний ответ</dt>
                                    <dd>${escapeHtml(preservedContext.answer || "Ответ ещё не подготовлен.")}</dd>
                                </div>
                                <div>
                                    <dt>Попытка</dt>
                                    <dd>${escapeHtml(String(preservedContext.attemptNumber))}</dd>
                                </div>
                                <div>
                                    <dt>Транспорт</dt>
                                    <dd>${escapeHtml(formatTransportBadge(preservedContext.transportDisposition))}</dd>
                                </div>
                            </dl>
                            ${preservedContext.errorMessage ? `
                                <div class="practice-inline-note practice-inline-note--warning">
                                    <p class="panel-copy">${escapeHtml(preservedContext.errorMessage)}</p>
                                </div>
                            ` : ""}
                        </div>
                    </div>
                </details>
                ${hasExplanationDetails ? `
                    <details class="practice-feedback__details">
                        <summary class="practice-feedback__details-summary">Подробности объяснения</summary>
                        <div class="practice-feedback__details-body">
                            ${normalizedFeedback.explanation.tone === "partial" ? `
                                <div class="practice-inline-note practice-inline-note--warning" data-partial-match-message>
                                    <p class="panel-copy">Ответ достаточно близок, чтобы остаться в том же контексте задачи, но всё ещё требует более точной команды.</p>
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
                    </details>
                ` : ""}
                ${hasHintLayer ? `
                    <details class="practice-feedback__details" data-retry-feedback-slot="hint">
                        <summary class="practice-feedback__details-summary">Подсказки и reveal</summary>
                        <div class="practice-feedback__details-body">
                            <div class="practice-inline-note">
                                <p class="panel-copy">${escapeHtml(normalizedFeedback.hint.message)}</p>
                            </div>
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
                    </details>
                ` : ""}
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
                    <span class="practice-feedback__pill">Статус: ${escapeHtml(formatRetryFeedbackBadge(outcome.status ?? "unknown"))}</span>
                    <span class="practice-feedback__pill">Код: ${escapeHtml(outcome.code ?? "неизвестно")}</span>
                    <span class="practice-feedback__pill">Тип ответа: ${escapeHtml(formatAnswerType(submissionResponse.answer?.type ?? "unknown"))}</span>
                    <span class="practice-feedback__pill">Попытка: ${escapeHtml(String(submissionResponse.attemptNumber ?? "?"))}</span>
                </div>
                ${correctness === "unsupported" ? `
                    <div class="practice-inline-note practice-inline-note--warning">
                        <p class="panel-copy">
                            Сейчас эта сессия поддерживает: ${escapeHtml(supportedTypesCopy)}.
                            Отправьте ответ как одну Git-команду в поле ввода и повторите попытку.
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
            <div class="branch-graph branch-graph--empty" data-repository-branch-graph="empty">
                <div class="branch-graph__empty">
                    <span class="control-label">Пустое состояние</span>
                    <p class="panel-copy">В текущих данных задания нет подсказок по веткам.</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="branch-graph" aria-label="Схема Git-веток" data-repository-branch-graph="ready">
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

function renderRepositoryWorkspaceCanvas(repositoryContext, workspacePlayback) {
    return `
        <div
            class="repository-workspace repository-workspace--${escapeHtml(workspacePlayback.status)} repository-workspace--plain"
            data-repository-workspace-visual="ready"
            data-workspace-playback-status="${escapeHtml(workspacePlayback.status)}"
        >
            ${renderRepositoryCommitTree(repositoryContext.graph, workspacePlayback)}
        </div>
    `;
}

function renderPracticeRepositorySupplement(repositoryContext, workspacePlayback, bootstrapState, submissionState, lifecycle) {
    return `
        <div class="practice-context-details">
            <div class="practice-shell__meta practice-shell__meta--viewer">
                <span class="practice-shell__chip">Текущая ветка: ${escapeHtml(resolveCurrentBranchName(repositoryContext.branches))}</span>
                <span class="practice-shell__chip">Ветки: ${repositoryContext.branches.length}</span>
                <span class="practice-shell__chip">Файлы: ${repositoryContext.files.length}</span>
                <span class="practice-shell__chip">Коммиты: ${repositoryContext.commits.length}</span>
                <span class="practice-shell__chip">Сессия: ${escapeHtml(formatTransportBadge(resolveTransportBadge(bootstrapState, submissionState)))}</span>
            </div>
            ${renderViewerStatusStrip(bootstrapState, lifecycle)}
        </div>
    `;
}

function renderWorkspaceTerminal({
    scenarioTitle,
    accentTag,
    submissionDraft,
    bootstrapState,
    submissionState,
    workspacePlayback,
    repositoryContext,
    commandHistory,
    submitDisabled,
    resetDisabled
}) {
    const statusLabel = formatWorkspacePlaybackStatus(workspacePlayback.status);
    const statusCopy = describeWorkspacePlaybackStatus(workspacePlayback, repositoryContext);
    const transcriptItems = buildWorkspaceTerminalTranscript({
        submissionDraft,
        bootstrapState,
        submissionState,
        workspacePlayback,
        repositoryContext,
        commandHistory,
        statusCopy
    });

    return `
        <section
            class="workspace-terminal workspace-terminal--plain"
            data-workspace-console-state="${escapeHtml(workspacePlayback.status)}"${accentTag ? ` data-workspace-command-active-tag="${escapeHtml(accentTag)}"` : ""}
        >
            <div class="workspace-terminal__header" data-workspace-terminal-header>
                <span class="workspace-terminal__title">Git Terminal</span>
            </div>
            <div class="workspace-terminal__body" data-workspace-command-history>
                <div class="workspace-terminal__history">
                    ${transcriptItems.map((entry) => entry.kind === "command" ? `
                        <article
                            class="workspace-terminal__entry workspace-terminal__entry--${escapeHtml(entry.status)}"
                            data-workspace-command-status="${escapeHtml(entry.status)}"
                            data-workspace-command-id="${escapeHtml(entry.id)}"
                            data-workspace-transcript-id="${escapeHtml(entry.id)}"
                        >
                            <div class="workspace-terminal__line">
                                <span class="workspace-terminal__prompt">git-trainer%</span>
                                <code class="workspace-terminal__command">${escapeHtml(entry.command)}</code>
                            </div>
                            ${renderWorkspaceTerminalStreams(entry.terminalOutput)}
                            ${renderWorkspaceTerminalSummary(entry)}
                        </article>
                    ` : `
                        <p
                            class="panel-copy workspace-terminal__output workspace-terminal__output--${escapeHtml(entry.tone)}"
                            data-workspace-terminal-output="${escapeHtml(entry.tone)}"
                            data-workspace-transcript-id="${escapeHtml(entry.id)}"
                        >${escapeHtml(entry.text)}</p>
                    `).join("")}
                </div>
                <form class="workspace-terminal__form practice-composer__form" data-submission-draft-form>
                    <div class="workspace-terminal__editor">
                        <span class="workspace-terminal__prompt workspace-terminal__prompt--input">git-trainer%</span>
                        <textarea
                            class="workspace-terminal__input"
                            name="answer"
                            rows="1"
                            aria-label="Ввод Git-команды"
                            placeholder="Введите Git-команду"${submissionState.status === "pending" || bootstrapState.status === "pending" ? " disabled" : ""}
                        >${escapeHtml(submissionDraft.answer ?? "")}</textarea>
                        ${workspacePlayback.status === "running" || workspacePlayback.status === "booting"
            ? '<span class="workspace-terminal__cursor" aria-hidden="true"></span>'
            : ""}
                        <button class="workspace-terminal__action workspace-terminal__action--submit" type="submit"${submitDisabled ? " disabled" : ""}>send</button>
                        <button class="workspace-terminal__action workspace-terminal__action--reset" type="button" data-reset-submission-draft${resetDisabled ? " disabled" : ""}>clear</button>
                    </div>
                </form>
            </div>
        </section>
    `;
}

function buildWorkspaceTerminalTranscript({
    commandHistory
}) {
    return commandHistory.map((entry) => (
        entry.kind === "system"
            ? {
                id: entry.id,
                kind: "system",
                text: entry.text,
                tone: entry.tone
            }
            : {
                id: entry.id,
                kind: "command",
                command: entry.command,
                status: entry.status,
                summary: entry.summary,
                terminalOutput: entry.terminalOutput
            }
    ));
}

function renderWorkspaceTerminalStreams(terminalOutput) {
    if (!terminalOutput) {
        return "";
    }

    const stdoutBlock = terminalOutput.stdout
        ? `<pre class="workspace-terminal__stream workspace-terminal__stream--stdout">${escapeHtml(terminalOutput.stdout)}</pre>`
        : "";
    const stderrBlock = terminalOutput.stderr
        ? `<pre class="workspace-terminal__stream workspace-terminal__stream--stderr">${escapeHtml(terminalOutput.stderr)}</pre>`
        : "";

    return `${stdoutBlock}${stderrBlock}`;
}

function renderWorkspaceTerminalSummary(entry) {
    return "";
}

function buildCommitTreeLayout(graph) {
    const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
    if (!nodes.length) {
        return {
            laneCount: 1,
            rows: []
        };
    }

    let activeLanes = [];
    let maxLane = 0;
    const rows = nodes.map((node) => {
        let lane = activeLanes.indexOf(node.id);
        if (lane === -1) {
            lane = activeLanes.length;
            activeLanes = [...activeLanes, node.id];
        }

        const activeBefore = [...activeLanes];
        const activeAfter = [...activeLanes];
        const parentLanes = [];
        if (node.parentIds.length === 0) {
            activeAfter.splice(lane, 1);
        } else {
            activeAfter[lane] = node.parentIds[0];
            parentLanes.push(activeAfter.indexOf(node.parentIds[0]));
            for (let index = 1; index < node.parentIds.length; index += 1) {
                const parentId = node.parentIds[index];
                let parentLane = activeAfter.indexOf(parentId);
                if (parentLane === -1) {
                    parentLane = lane + index;
                    activeAfter.splice(parentLane, 0, parentId);
                }
                parentLanes.push(parentLane);
            }
        }

        maxLane = Math.max(maxLane, lane, ...parentLanes);
        const row = {
            node,
            lane,
            parentLanes,
            activeBefore,
            activeAfter
        };
        activeLanes = activeAfter;
        return row;
    });

    return {
        laneCount: Math.max(maxLane + 1, 1),
        rows
    };
}

function renderCommitLaneCell(row, laneIndex) {
    const hasTop = laneIndex < row.activeBefore.length;
    const hasBottom = laneIndex < row.activeAfter.length;
    const isNodeLane = row.lane === laneIndex;
    const horizontal = row.parentLanes.some((parentLane) => isLaneWithinSegment(laneIndex, row.lane, parentLane));
    const parentTarget = row.parentLanes.includes(laneIndex) && laneIndex !== row.lane;

    return `
        <span class="workspace-commit-tree__lane-cell ${isNodeLane ? "workspace-commit-tree__lane-cell--node" : ""}">
            ${hasTop ? '<span class="workspace-commit-tree__line workspace-commit-tree__line--top"></span>' : ""}
            ${hasBottom ? '<span class="workspace-commit-tree__line workspace-commit-tree__line--bottom"></span>' : ""}
            ${horizontal ? '<span class="workspace-commit-tree__line workspace-commit-tree__line--horizontal"></span>' : ""}
            ${parentTarget ? '<span class="workspace-commit-tree__line workspace-commit-tree__line--target"></span>' : ""}
            ${isNodeLane ? '<span class="workspace-commit-tree__dot"></span>' : ""}
        </span>
    `;
}

function formatShortCommitId(commitId) {
    if (typeof commitId !== "string" || commitId.trim() === "") {
        return "unknown";
    }

    return commitId.slice(0, 7);
}

function sortCommitRefs(refs) {
    const refTypePriority = {
        head: 0,
        branch: 1,
        remote: 2,
        tag: 3,
        stash: 4
    };

    return [...refs].sort((left, right) => {
        if (left.current !== right.current) {
            return left.current ? -1 : 1;
        }

        const leftPriority = refTypePriority[left.type] ?? 9;
        const rightPriority = refTypePriority[right.type] ?? 9;
        if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
        }

        return left.name.localeCompare(right.name);
    });
}

function formatCommitTreeMeta(node, index) {
    const headLabel = index === 0 ? "HEAD" : `HEAD~${index}`;
    if (!Array.isArray(node.parentIds) || node.parentIds.length === 0) {
        return `${headLabel} ROOT`;
    }

    const parentLabel = node.parentIds
        .map((parentId) => formatShortCommitId(parentId).toUpperCase())
        .join(", ");
    return `${headLabel} PARENTS: ${parentLabel}`;
}

function isLaneWithinSegment(laneIndex, fromLane, toLane) {
    if (fromLane === toLane) {
        return false;
    }

    const start = Math.min(fromLane, toLane);
    const end = Math.max(fromLane, toLane);
    return laneIndex >= start && laneIndex <= end;
}

function resolveCommitTreeRowClass(row, workspacePlayback) {
    if (workspacePlayback.status === "running" && workspacePlayback.previousContext?.graph?.nodes) {
        return row.node.id === workspacePlayback.previousContext.graph.nodes[0]?.id
            ? "workspace-commit-tree__row--active"
            : "";
    }

    const previousNodeIds = new Set(
        Array.isArray(workspacePlayback.previousContext?.graph?.nodes)
            ? workspacePlayback.previousContext.graph.nodes.map((node) => node.id)
            : []
    );
    if (workspacePlayback.status === "updated" && !previousNodeIds.has(row.node.id)) {
        return "workspace-commit-tree__row--new";
    }

    return row.node.refs.some((ref) => ref.current)
        ? "workspace-commit-tree__row--current"
        : "";
}

function renderRepositoryCommitTree(graph, workspacePlayback) {
    const layout = buildCommitTreeLayout(graph);
    if (!layout.rows.length) {
        return renderRepositoryEmptyState(
            "Граф коммитов недоступен",
            "В текущем payload нет данных для commit tree."
        );
    }

    return `
        <div
            class="workspace-commit-tree"
            data-repository-commit-tree
            style="--commit-tree-lanes:${layout.laneCount};"
        >
            ${layout.rows.map((row, index) => `
                <article
                    class="workspace-commit-tree__row ${resolveCommitTreeRowClass(row, workspacePlayback)}"
                    data-commit-node-id="${escapeHtml(row.node.id)}"
                >
                    <div class="workspace-commit-tree__lanes" aria-hidden="true">
                        ${Array.from({ length: layout.laneCount }, (_, laneIndex) =>
            renderCommitLaneCell(row, laneIndex)
        ).join("")}
                    </div>
                    <div class="workspace-commit-tree__content">
                        <div class="workspace-commit-tree__header">
                            <strong
                                class="workspace-commit-tree__hash"
                                title="${escapeHtml(row.node.id ?? "unknown")}"
                            >${escapeHtml(formatShortCommitId(row.node.id ?? "unknown"))}</strong>
                            <div class="workspace-commit-tree__refs">
                                ${sortCommitRefs(row.node.refs).map((ref) => `
                                    <span class="workspace-commit-tree__ref workspace-commit-tree__ref--${escapeHtml(ref.type)} ${ref.current ? "workspace-commit-tree__ref--current" : ""}">
                                        ${escapeHtml(ref.name)}
                                    </span>
                                `).join("")}
                            </div>
                        </div>
                        <p class="workspace-commit-tree__summary-row">
                            <span class="workspace-commit-tree__summary">${escapeHtml(row.node.summary ?? "Описание коммита не указано.")}</span>
                        </p>
                        <p class="workspace-commit-tree__meta">${escapeHtml(formatCommitTreeMeta(row.node, index))}</p>
                    </div>
                </article>
            `).join("")}
        </div>
    `;
}

function renderRepositoryWorkingTree(files) {
    if (!files.length) {
        return renderRepositoryEmptyState(
            "Рабочее дерево чистое",
            "В текущем snapshot нет незакоммиченных изменений."
        );
    }

    return `
        <div class="workspace-file-stack" data-repository-working-tree>
            ${files.map((file) => {
                const normalizedStatus = normalizeRepositoryFileStatus(file.status);
                return `
                    <article class="workspace-file-stack__item" data-repository-file-node="${escapeHtml(normalizedStatus)}">
                        <span class="workspace-file-stack__marker workspace-file-stack__marker--${escapeHtml(normalizedStatus)}" aria-hidden="true"></span>
                        <div class="workspace-file-stack__body">
                            <div class="workspace-file-stack__header">
                                <strong>${escapeHtml(file.path ?? "Неизвестный путь")}</strong>
                                <span class="repository-status-pill repository-status-pill--${escapeHtml(normalizedStatus)}">
                                    ${escapeHtml(formatRepositoryFileStatus(file.status))}
                                </span>
                            </div>
                            <p class="panel-copy">${escapeHtml(describeRepositoryFileStatus(file.status))}</p>
                        </div>
                    </article>
                `;
            }).join("")}
        </div>
    `;
}

function renderRepositoryAnnotationRail(annotations) {
    if (!annotations.length) {
        return renderRepositoryEmptyState(
            "Подсказок пока нет",
            "Сценарий не добавил авторские пояснения к текущему workspace."
        );
    }

    return `
        <div class="workspace-annotation-rail" data-repository-annotation-rail>
            ${annotations.map((annotation) => `
                <article class="workspace-annotation-rail__item">
                    <span class="control-label">${escapeHtml(annotation.label ?? "Аннотация")}</span>
                    <p class="panel-copy">${escapeHtml(annotation.message ?? "Сообщение аннотации недоступно.")}</p>
                </article>
            `).join("")}
        </div>
    `;
}

function renderRepositoryEmptyState(title, copy) {
    return `
        <div class="repository-context__empty">
            <span class="control-label">${escapeHtml(title)}</span>
            <p class="panel-copy">${escapeHtml(copy)}</p>
        </div>
    `;
}

function normalizeWorkspacePlayback(playback) {
    const safePlayback = playback ?? {};
    const normalizedCurrent = safePlayback.currentContext == null
        ? null
        : normalizeRepositoryContext(safePlayback.currentContext);
    const previousContext = safePlayback.previousContext == null
        ? null
        : normalizeRepositoryContext(safePlayback.previousContext);

    return {
        status: typeof safePlayback.status === "string" && safePlayback.status.trim() !== ""
            ? safePlayback.status
            : "idle",
        currentContext: normalizedCurrent,
        previousContext,
        command: typeof safePlayback.command === "string" && safePlayback.command.trim() !== ""
            ? safePlayback.command.trim()
            : null,
        outcomeCorrectness: typeof safePlayback.outcomeCorrectness === "string" && safePlayback.outcomeCorrectness.trim() !== ""
            ? safePlayback.outcomeCorrectness
            : null,
        updatedAt: safePlayback.updatedAt ?? null
    };
}

function resolveViewerRepositoryContext(repositoryContext, workspacePlayback) {
    if (workspacePlayback.status === "booting" && workspacePlayback.currentContext == null) {
        return normalizeRepositoryContext(null);
    }

    return repositoryContext;
}

function normalizeCommandHistory(commandHistory) {
    return Array.isArray(commandHistory)
        ? commandHistory
            .filter((entry) => entry && typeof entry === "object")
            .map((entry, index) => {
                if (entry.kind === "system") {
                    return {
                        id: typeof entry.id === "string" && entry.id.trim() !== ""
                            ? entry.id
                            : `system-${index + 1}`,
                        kind: "system",
                        text: typeof entry.text === "string" && entry.text.trim() !== ""
                            ? entry.text.trim()
                            : "Системное сообщение недоступно.",
                        tone: typeof entry.tone === "string" && entry.tone.trim() !== ""
                            ? entry.tone
                            : "system",
                        createdAt: entry.createdAt ?? null,
                        completedAt: entry.completedAt ?? null
                    };
                }

                return {
                    id: typeof entry.id === "string" && entry.id.trim() !== ""
                        ? entry.id
                        : `command-${index + 1}`,
                    kind: "command",
                    command: typeof entry.command === "string" && entry.command.trim() !== ""
                        ? entry.command.trim()
                        : "unknown command",
                    status: typeof entry.status === "string" && entry.status.trim() !== ""
                        ? entry.status
                        : "idle",
                    summary: typeof entry.summary === "string" && entry.summary.trim() !== ""
                        ? entry.summary
                        : "",
                    terminalOutput: normalizeCommandTerminalOutput(entry.terminalOutput),
                    createdAt: entry.createdAt ?? null,
                    completedAt: entry.completedAt ?? null
                };
            })
        : [];
}

function normalizeCommandTerminalOutput(terminalOutput) {
    const safeOutput = terminalOutput ?? {};
    const stdout = typeof safeOutput.stdout === "string" ? safeOutput.stdout : "";
    const stderr = typeof safeOutput.stderr === "string" ? safeOutput.stderr : "";

    if (!stdout.trim() && !stderr.trim()) {
        return null;
    }

    return { stdout, stderr };
}

function normalizeRepositoryContext(repositoryContext) {
    const safeContext = repositoryContext ?? {};
    const branches = Array.isArray(safeContext.branches) ? safeContext.branches : [];
    const commits = Array.isArray(safeContext.commits) ? safeContext.commits : [];
    return {
        status: typeof safeContext.status === "string" && safeContext.status.trim() !== ""
            ? safeContext.status
            : "unavailable",
        branches,
        commits,
        files: Array.isArray(safeContext.files) ? safeContext.files : [],
        annotations: Array.isArray(safeContext.annotations) ? safeContext.annotations : [],
        graph: normalizeRepositoryGraph(safeContext.graph, branches, commits)
    };
}

function normalizeRepositoryGraph(graph, branches, commits) {
    const safeGraph = graph ?? {};
    const nodes = Array.isArray(safeGraph.nodes)
        ? safeGraph.nodes
            .filter((node) => node && typeof node === "object")
            .map((node) => ({
                id: typeof node.id === "string" && node.id.trim() !== ""
                    ? node.id
                    : "unknown",
                summary: typeof node.summary === "string" ? node.summary : "",
                parentIds: Array.isArray(node.parentIds)
                    ? node.parentIds.filter((parentId) => typeof parentId === "string" && parentId.trim() !== "")
                    : [],
                refs: Array.isArray(node.refs)
                    ? node.refs
                        .filter((ref) => ref && typeof ref === "object")
                        .map((ref) => ({
                            name: typeof ref.name === "string" && ref.name.trim() !== "" ? ref.name : "ref",
                            type: typeof ref.type === "string" && ref.type.trim() !== "" ? ref.type : "branch",
                            current: Boolean(ref.current)
                        }))
                    : []
            }))
        : [];

    if (nodes.length) {
        return { nodes };
    }

    return synthesizeRepositoryGraph(branches, commits);
}

function synthesizeRepositoryGraph(branches, commits) {
    if (!Array.isArray(commits) || commits.length === 0) {
        return { nodes: [] };
    }

    return {
        nodes: commits.map((commit, index) => ({
            id: typeof commit?.id === "string" ? commit.id : `commit-${index + 1}`,
            summary: typeof commit?.summary === "string" ? commit.summary : "",
            parentIds: index + 1 < commits.length && typeof commits[index + 1]?.id === "string"
                ? [commits[index + 1].id]
                : [],
            refs: index === 0
                ? (Array.isArray(branches) ? branches : []).map((branch) => ({
                    name: typeof branch?.name === "string" ? branch.name : "branch",
                    type: typeof branch?.name === "string" && branch.name.startsWith("origin/") ? "remote" : "branch",
                    current: Boolean(branch?.current)
                }))
                : []
        }))
    };
}

function resolveActiveRepositoryContext(detail, bootstrapState, submissionState) {
    return submissionState.response?.workspace?.repositoryContext
        ?? bootstrapState.response?.workspace?.repositoryContext
        ?? detail?.workspace?.repositoryContext
        ?? null;
}

function normalizeRepositoryFileStatus(status) {
    return typeof status === "string" && status.trim() !== ""
        ? status.trim().toLowerCase()
        : "unknown";
}

function formatRepositoryFileStatus(status) {
    switch (normalizeRepositoryFileStatus(status)) {
        case "modified":
            return "изменён";
        case "untracked":
            return "не отслеживается";
        case "staged":
            return "в индексе";
        case "deleted":
            return "удалён";
        case "renamed":
            return "переименован";
        case "conflicted":
            return "конфликт";
        case "clean":
            return "чистый";
        default:
            return "неизвестно";
    }
}

function describeRepositoryFileStatus(status) {
    switch (normalizeRepositoryFileStatus(status)) {
        case "modified":
            return "Файл уже отслеживается и содержит локальные изменения.";
        case "untracked":
            return "Файл пока не добавлен в индекс и не отслеживается Git.";
        case "staged":
            return "Изменение уже попало в индекс и готово к коммиту.";
        case "deleted":
            return "Файл помечен на удаление в текущем состоянии рабочего дерева или индекса.";
        case "renamed":
            return "Git уже видит путь как переименование относительно предыдущего состояния.";
        case "conflicted":
            return "По этому пути есть конфликт, который нужно разрешить до следующего шага.";
        case "clean":
            return "По этому пути нет незакоммиченных изменений.";
        default:
            return "Статус файла не удалось интерпретировать из текущего payload.";
    }
}

function resolveWorkspaceDefaultCommand(status) {
    switch (status) {
        case "booting":
            return "prepare workspace";
        case "running":
            return "executing command";
        case "updated":
            return "workspace updated";
        case "retryable-error":
        case "terminal-error":
            return "command failed";
        case "ready":
            return "session attached";
        default:
            return "open scenario";
    }
}

function formatWorkspacePlaybackStatus(status) {
    switch (status) {
        case "booting":
            return "booting";
        case "ready":
            return "attached";
        case "running":
            return "running";
        case "updated":
            return "applied";
        case "retryable-error":
            return "retryable";
        case "terminal-error":
            return "failed";
        default:
            return "idle";
    }
}

function formatCommandHistoryStatus(status) {
    switch (status) {
        case "running":
            return "running";
        case "correct":
            return "correct";
        case "applied":
            return "applied";
        case "failed":
            return "failed";
        case "system":
            return "system";
        default:
            return "idle";
    }
}

function mapCommandHistoryTone(status) {
    switch (status) {
        case "correct":
            return "correct";
        case "failed":
            return "error";
        case "running":
            return "pending";
        case "system":
            return "system";
        case "applied":
            return "accent";
        default:
            return "muted";
    }
}

function mapPlaybackStatusToTranscriptTone(status) {
    switch (status) {
        case "booting":
        case "running":
            return "pending";
        case "updated":
        case "ready":
            return "system";
        case "retryable-error":
        case "terminal-error":
            return "error";
        default:
            return "muted";
    }
}

function formatWorkspacePlaybackHeadline(status) {
    switch (status) {
        case "booting":
            return "Подключаем session-backed workspace";
        case "ready":
            return "Workspace синхронизирован";
        case "running":
            return "Команда выполняется";
        case "updated":
            return "Состояние workspace обновлено";
        case "retryable-error":
            return "Команду можно повторить";
        case "terminal-error":
            return "Выполнение остановлено";
        default:
            return "Workspace ждёт первую команду";
    }
}

function describeWorkspacePlaybackStatus(workspacePlayback, repositoryContext) {
    switch (workspacePlayback.status) {
        case "booting":
            return "Создаём рабочую копию сценария и подготавливаем Git-состояние для первой отправки.";
        case "ready":
            return "";
        case "running":
            return `Команда ${workspacePlayback.command ? `"${workspacePlayback.command}"` : "пользователя"} выполняется на snapshot текущей сессии.`;
        case "updated":
            return "";
        case "retryable-error":
            return "Снимок workspace сохранён, но команду не удалось довести до результата. Попробуйте повторную отправку.";
        case "terminal-error":
            return "";
        default:
            return "После первой команды здесь появится живая история изменений workspace.";
    }
}

function deriveWorkspaceActivityItems(workspacePlayback, repositoryContext) {
    const currentContext = workspacePlayback.currentContext ?? repositoryContext;
    const previousContext = workspacePlayback.previousContext;

    if (workspacePlayback.status === "booting") {
        return [
            {
                kind: "boot",
                title: "Создаём workspace",
                message: "Собираем Git-состояние сценария и подключаем session-backed репозиторий."
            }
        ];
    }

    if (workspacePlayback.status === "running") {
        return [
            {
                kind: "command",
                title: "Команда отправлена",
                message: workspacePlayback.command
                    ? `Выполняем: ${workspacePlayback.command}. Viewer ждёт обновлённый snapshot.`
                    : "Viewer ждёт обновлённый snapshot после отправки команды."
            },
            {
                kind: "snapshot",
                title: "Базовый snapshot зафиксирован",
                message: `Текущая ветка ${resolveCurrentBranchName(currentContext.branches)} сохранена как точка сравнения.`
            }
        ];
    }

    if (!previousContext) {
        return [
            {
                kind: "ready",
                title: "Workspace готов",
                message: `Подключена ветка ${resolveCurrentBranchName(currentContext.branches)}. В рабочем дереве ${currentContext.files.length} ${pluralizeFiles(currentContext.files.length)}.`
            }
        ];
    }

    const items = [];
    const graphChange = describeGraphDelta(previousContext, currentContext);
    if (graphChange) {
        items.push(graphChange);
    }

    const branchChange = describeBranchDelta(previousContext, currentContext);
    if (branchChange) {
        items.push(branchChange);
    }

    const fileChange = describeFileDelta(previousContext, currentContext);
    if (fileChange) {
        items.push(fileChange);
    }

    const stashChange = describeAnnotationDelta(previousContext, currentContext, "stash", "stash");
    if (stashChange) {
        items.push(stashChange);
    }

    const workingTreeAnnotationChange = describeAnnotationDelta(previousContext, currentContext, "рабочее дерево", "working-tree");
    if (workingTreeAnnotationChange) {
        items.push(workingTreeAnnotationChange);
    }

    if (!items.length) {
        items.push({
            kind: "steady",
            title: "Явных изменений в snapshot нет",
            message: "Команда не изменила наблюдаемую структуру веток, файлов и аннотаций workspace."
        });
    }

    return items;
}

function describeGraphDelta(previousContext, currentContext) {
    const previousGraph = previousContext.graph?.nodes ?? [];
    const currentGraph = currentContext.graph?.nodes ?? [];

    if (!previousGraph.length && currentGraph.length) {
        return {
            kind: "graph",
            title: "Появилось дерево коммитов",
            message: `Viewer построил commit tree из ${currentGraph.length} ${pluralizeCommits(currentGraph.length)}.`
        };
    }

    const previousIds = new Set(previousGraph.map((node) => node.id));
    const currentIds = new Set(currentGraph.map((node) => node.id));
    const newIds = currentGraph.filter((node) => !previousIds.has(node.id)).map((node) => node.id);

    if (newIds.length) {
        return {
            kind: "graph",
            title: "В графе появились новые коммиты",
            message: `Commit tree дополнился: ${newIds.join(", ")}.`
        };
    }

    const previousRefSignature = serializeGraphRefs(previousGraph);
    const currentRefSignature = serializeGraphRefs(currentGraph);
    if (previousRefSignature !== currentRefSignature) {
        return {
            kind: "graph",
            title: "Сдвинулись указатели дерева",
            message: "У commit tree изменились ref-метки веток, тегов или stash после команды."
        };
    }

    return null;
}

function serializeGraphRefs(nodes) {
    return nodes
        .map((node) => `${node.id}:${(node.refs ?? [])
            .map((ref) => `${ref.type}:${ref.name}:${ref.current ? "1" : "0"}`)
            .sort()
            .join(",")}`)
        .join("|");
}

function describeBranchDelta(previousContext, currentContext) {
    const previousBranch = resolveCurrentBranchName(previousContext.branches);
    const currentBranch = resolveCurrentBranchName(currentContext.branches);

    if (previousBranch !== currentBranch) {
        return {
            kind: "branch",
            title: "Сменилась активная ветка",
            message: `Viewer переключился с ${previousBranch} на ${currentBranch}.`
        };
    }

    if (previousContext.branches.length !== currentContext.branches.length) {
        return {
            kind: "branch",
            title: "Обновился набор веток",
            message: `Количество видимых веток изменилось: ${previousContext.branches.length} -> ${currentContext.branches.length}.`
        };
    }

    return null;
}

function describeFileDelta(previousContext, currentContext) {
    const previousFiles = Array.isArray(previousContext.files) ? previousContext.files : [];
    const currentFiles = Array.isArray(currentContext.files) ? currentContext.files : [];

    if (previousFiles.length && !currentFiles.length) {
        return {
            kind: "files",
            title: "Рабочее дерево очищено",
            message: `Все ${previousFiles.length} ${pluralizeFiles(previousFiles.length)} исчезли из списка изменений.`
        };
    }

    if (previousFiles.length !== currentFiles.length) {
        return {
            kind: "files",
            title: "Изменился набор файлов",
            message: `Количество путей в рабочем дереве изменилось: ${previousFiles.length} -> ${currentFiles.length}.`
        };
    }

    const previousSignature = previousFiles
        .map((file) => `${file.path}:${normalizeRepositoryFileStatus(file.status)}`)
        .sort()
        .join("|");
    const currentSignature = currentFiles
        .map((file) => `${file.path}:${normalizeRepositoryFileStatus(file.status)}`)
        .sort()
        .join("|");

    if (previousSignature !== currentSignature) {
        return {
            kind: "files",
            title: "Статусы файлов обновились",
            message: "Viewer получил новый набор file-status маркеров после выполнения команды."
        };
    }

    return null;
}

function describeAnnotationDelta(previousContext, currentContext, labelNeedle, kind) {
    const previousAnnotation = findAnnotationByLabel(previousContext.annotations, labelNeedle);
    const currentAnnotation = findAnnotationByLabel(currentContext.annotations, labelNeedle);

    if (!previousAnnotation && !currentAnnotation) {
        return null;
    }

    if (!previousAnnotation && currentAnnotation) {
        return {
            kind,
            title: "Появилась новая системная подсказка",
            message: currentAnnotation.message ?? "Viewer получил новую аннотацию workspace."
        };
    }

    if (previousAnnotation && !currentAnnotation) {
        return {
            kind,
            title: "Аннотация больше не активна",
            message: `Подсказка "${previousAnnotation.label}" исчезла из текущего snapshot.`
        };
    }

    if (previousAnnotation.message !== currentAnnotation.message) {
        return {
            kind,
            title: "Обновилась системная аннотация",
            message: currentAnnotation.message ?? "Сообщение аннотации изменилось."
        };
    }

    return null;
}

function findAnnotationByLabel(annotations, needle) {
    if (!Array.isArray(annotations)) {
        return null;
    }

    const normalizedNeedle = String(needle ?? "").trim().toLowerCase();
    return annotations.find((annotation) => String(annotation?.label ?? "").trim().toLowerCase().includes(normalizedNeedle))
        ?? null;
}

function describeRepositoryWorkspace(repositoryContext) {
    const branchSummary = summarizeBranchTopology(repositoryContext.branches);
    const workingTreeSummary = summarizeWorkingTree(repositoryContext.files);

    return `${branchSummary} ${workingTreeSummary}`;
}

function summarizeBranchTopology(branches) {
    if (!Array.isArray(branches) || branches.length === 0) {
        return "Данные по веткам пока не пришли.";
    }

    const currentBranchName = resolveCurrentBranchName(branches);
    if (branches.length === 1) {
        return `Активна единственная ветка ${currentBranchName}.`;
    }

    return `Активная ветка ${currentBranchName}; рядом доступно ещё ${branches.length - 1} ${pluralizeBranches(branches.length - 1)}.`;
}

function summarizeWorkingTree(files) {
    if (!Array.isArray(files) || files.length === 0) {
        return "Рабочее дерево выглядит чистым.";
    }

    const counts = files.reduce((summary, file) => {
        const status = normalizeRepositoryFileStatus(file?.status);
        summary.total += 1;
        summary[status] = (summary[status] ?? 0) + 1;
        return summary;
    }, { total: 0 });
    const fragments = [];

    if (counts.modified) {
        fragments.push(`${counts.modified} изменён${counts.modified === 1 ? "" : "о"}`);
    }
    if (counts.staged) {
        fragments.push(`${counts.staged} в индексе`);
    }
    if (counts.untracked) {
        fragments.push(`${counts.untracked} не отслеживается`);
    }
    if (counts.conflicted) {
        fragments.push(`${counts.conflicted} конфликт${counts.conflicted === 1 ? "" : "а"}`);
    }

    if (!fragments.length) {
        return `В рабочем дереве ${counts.total} ${pluralizeFiles(counts.total)} с нестандартным состоянием.`;
    }

    return `В рабочем дереве ${counts.total} ${pluralizeFiles(counts.total)}: ${fragments.join(", ")}.`;
}

function resolveCurrentBranchName(branches) {
    const currentBranch = Array.isArray(branches)
        ? branches.find((branch) => branch?.current)
        : null;

    return typeof currentBranch?.name === "string" && currentBranch.name.trim() !== ""
        ? currentBranch.name
        : "неизвестно";
}

function pluralizeBranches(count) {
    return count === 1 ? "ветка" : count >= 2 && count <= 4 ? "ветки" : "веток";
}

function pluralizeFiles(count) {
    return count === 1 ? "файл" : count >= 2 && count <= 4 ? "файла" : "файлов";
}

function pluralizeCommits(count) {
    return count === 1 ? "коммит" : count >= 2 && count <= 4 ? "коммита" : "коммитов";
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
            return "Контекст упражнения остаётся на месте после неудачной проверки, а доступность повтора и уровень подсказки синхронизируются с последним ответом.";
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
    return "текст команды";
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
        : "Сессия готова к первой проверяемой отправке.";
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
        case "db-seeded":
            return "из БД";
        case "live-session":
            return "живая сессия";
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

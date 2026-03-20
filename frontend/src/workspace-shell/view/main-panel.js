import { renderLessonLane } from "./lesson-layout.js";
import {
    normalizeTaskAnnotations,
    normalizeTaskInstructions,
    normalizeTaskSteps
} from "./lesson-task.js";
import {
    encodeHashSegment,
    escapeHtml,
    formatDifficulty,
    formatProviderName,
    formatProviderOptionLabel,
    isDiagnosticProvider,
    formatTag
} from "./render-helpers.js";

export function renderMainPanel(state, { tagOptions = [], providerOptions = [] } = {}) {
    return renderLessonLane({
        lane: "lesson",
        showHeader: false,
        body: renderMainPanelContent(state, { tagOptions, providerOptions })
    });
}

export function renderMainPanelContent(state, { tagOptions = [], providerOptions = [] } = {}) {
    if (state.route === "exercise") {
        return renderExerciseMainPanelContent(state);
    }

    if (state.route === "progress") {
        return renderProgressMainPanelContent(state);
    }

    return `
            ${renderMainLead({
                label: "Стартовая страница",
                title: "Выберите блок задания слева",
                description: "Слева находятся сценарии и шаги, по центру открывается описание, справа остаётся практика.",
                meta: [
                    `Сценарии: ${state.catalog.items.length}`,
                    `Каталог: ${formatCatalogStatus(state.catalog.status)}`
            ]
        })}
        ${renderWelcomePage(state, { tagOptions, providerOptions })}
    `;
}

function renderProgressMainPanelContent(state) {
    if (state.progress.status === "loading" || state.progress.status === "idle") {
        return `
            ${renderMainLead({
                label: "Экран прогресса",
                title: "Загружаем экран прогресса",
                description: "Экран уже открыт и ждёт данные о прогрессе.",
                meta: [
                    `Маршрут: ${formatRoute(state.route)}`,
                    `Статус: ${formatCatalogStatus(state.progress.status)}`
                ]
            })}
            <section class="lesson-spotlight lesson-spotlight--loading" data-progress-surface>
                <span class="control-label">Состояние прогресса</span>
                <h4 class="lesson-block__title">Подготавливаем маркеры прогресса</h4>
                <p class="panel-copy">Маркеры статуса и недавняя активность появятся здесь, когда сводка будет готова.</p>
            </section>
        `;
    }

    if (state.progress.status === "error") {
        return `
            ${renderMainLead({
                label: "Экран прогресса",
                title: "Экран прогресса недоступен",
                description: "Даже при ошибке загрузки структура экрана остаётся на месте.",
                meta: [
                    `Маршрут: ${formatRoute(state.route)}`,
                    `Статус: ${formatCatalogStatus(state.progress.status)}`
                ]
            })}
            <section class="lesson-block lesson-block--reading" data-progress-surface>
                <div class="lesson-section__header">
                    <span class="control-label">Восстановление</span>
                    <h4 class="lesson-block__title">Сводка прогресса недоступна</h4>
                </div>
                <p class="panel-copy">${escapeHtml(state.progress.error ?? "Сводка прогресса сейчас недоступна.")}</p>
                ${renderProviderRecoveryNotice(state.providerName, { route: "progress" })}
            </section>
        `;
    }

    if (state.progress.status === "empty") {
        return `
            ${renderMainLead({
                label: "Экран прогресса",
                title: "Прогресс пока не записан",
                description: "Активность по сценариям ещё не появилась, но экран уже готов.",
                meta: [
                    `Маршрут: ${formatRoute(state.route)}`,
                    `Статус: ${formatCatalogStatus(state.progress.status)}`
                ]
            })}
            <section class="lesson-spotlight" data-progress-surface>
                <span class="control-label">Пустое состояние</span>
                <h4 class="lesson-block__title">Запустите сценарий, чтобы заполнить этот экран</h4>
                <p class="panel-copy">Как только пользователь начнёт или завершит сценарии, здесь появятся маркеры статуса и недавняя активность.</p>
            </section>
        `;
    }

    const summary = state.progress.summary;
    const totalScenarios = summary?.items?.length ?? 0;
    const completedCount = summary?.items?.filter((item) => item.status === "completed").length ?? 0;
    const inProgressCount = summary?.items?.filter((item) => item.status === "in_progress").length ?? 0;
    return `
            ${renderMainLead({
                label: "Экран прогресса",
                title: "Следите за прогрессом в одном месте",
                description: "Здесь собраны статусы сценариев, недавняя активность и рекомендации по следующему шагу.",
            meta: [
                `Маршрут: ${formatRoute(state.route)}`,
                `Статус: ${formatCatalogStatus(state.progress.status)}`,
                `Источник: ${formatProviderName(summary?.meta?.source ?? "unknown")}`
            ]
        })}
            <section class="lesson-spotlight" data-progress-surface>
                <span class="control-label">Обзор прогресса</span>
                <h4 class="lesson-block__title">Все сценарии видны одним взглядом</h4>
                <p class="panel-copy">На этом экране собраны завершённые, начатые и ещё не тронутые сценарии, чтобы быстро понять общую картину.</p>
            <div class="lesson-spotlight__meta">
                <span class="lesson-spotlight__pill">Сценарии: ${totalScenarios}</span>
                <span class="lesson-spotlight__pill">Завершено: ${completedCount}</span>
                <span class="lesson-spotlight__pill">В процессе: ${inProgressCount}</span>
            </div>
        </section>
        <section class="lesson-block lesson-block--reading">
            <div class="lesson-section__header">
                <span class="control-label">Маркеры сценариев</span>
                <h4 class="lesson-block__title">Текущий прогресс одним взглядом</h4>
            </div>
            <div class="progress-summary-grid">
                ${summary.items.map((item) => renderProgressItemCard(item)).join("")}
            </div>
        </section>
        <section class="lesson-block lesson-block--reading">
            <div class="lesson-section__header">
                <span class="control-label">Недавняя активность</span>
                <h4 class="lesson-block__title">Последние действия пользователя</h4>
            </div>
            <div class="progress-activity-list" data-progress-activity-list>
                ${summary.recentActivity.map((activity) => renderRecentProgressActivity(activity)).join("")}
            </div>
        </section>
        <section class="lesson-block lesson-block--reading">
            <div class="lesson-section__header">
                <span class="control-label">Следующий шаг</span>
                <h4 class="lesson-block__title">Рекомендации уже на месте</h4>
            </div>
            ${renderProgressGuidanceShell(summary.recommendations)}
        </section>
    `;
}

function renderProgressItemCard(item) {
    return `
        <article class="progress-card" data-progress-status-marker="${escapeHtml(item.status)}">
            <div class="progress-card__header">
                <span class="progress-status-marker progress-status-marker--${escapeHtml(item.status)}">${escapeHtml(formatProgressStatus(item.status))}</span>
                <span class="lesson-spotlight__pill">${escapeHtml(describeProgressCounts(item))}</span>
            </div>
            <strong>${escapeHtml(item.scenarioTitle)}</strong>
            <p class="panel-copy">${escapeHtml(describeProgressActivity(item))}</p>
        </article>
    `;
}

function renderRecentProgressActivity(activity) {
    return `
        <article class="progress-activity" data-progress-activity="${escapeHtml(activity.eventType)}">
            <div class="progress-activity__header">
                <span class="progress-status-marker progress-status-marker--${escapeHtml(activity.status)}">${escapeHtml(formatProgressStatus(activity.status))}</span>
                <span class="lesson-spotlight__pill">${escapeHtml(formatActivityType(activity.eventType))}</span>
            </div>
            <strong>${escapeHtml(activity.scenarioTitle)}</strong>
            <p class="panel-copy">${escapeHtml(describeRecentActivity(activity))}</p>
        </article>
    `;
}

function formatProgressStatus(status) {
    switch (status) {
        case "completed":
            return "завершено";
        case "in_progress":
            return "в процессе";
        case "not_started":
            return "не начато";
        case "planned":
            return "запланировано";
        default:
            return String(status ?? "неизвестно").replaceAll("_", " ");
    }
}

function describeProgressCounts(item) {
    return `${item.attemptCount} ${declineAttempt(item.attemptCount)} | ${item.completionCount} ${declineCompletion(item.completionCount)}`;
}

function describeProgressActivity(item) {
    if (item.lastActivityAt) {
        return `Последняя активность зафиксирована: ${item.lastActivityAt}.`;
    }

    return "Этот сценарий пока не запускали.";
}

function formatActivityType(eventType) {
    return eventType === "completed"
        ? "завершение"
        : eventType === "attempted"
            ? "попытка"
            : "старт";
}

function describeRecentActivity(activity) {
    return `Сценарий «${activity.scenarioTitle}» последний раз отмечал событие «${formatActivityType(activity.eventType)}» в ${activity.happenedAt}.`;
}

function renderProgressGuidanceShell(recommendations) {
    const solvedItems = recommendations?.solved ?? [];
    const attemptedItems = recommendations?.attempted ?? [];
    const solvedCount = recommendations?.solved?.length ?? 0;
    const attemptedCount = recommendations?.attempted?.length ?? 0;
    const nextScenario = recommendations?.next ?? null;
    const hasNextAttempt = nextScenario && attemptedItems.some(
        (scenario) => scenario.scenarioSlug === nextScenario.scenarioSlug
    );
    const primaryMarker = hasNextAttempt ? "in_progress" : "planned";
    const primaryLabel = hasNextAttempt ? "Продолжить следующий сценарий" : "Начать рекомендованный сценарий";
    const primaryHref = nextScenario
        ? `#/exercise/${encodeHashSegment(nextScenario.scenarioSlug)}`
        : "#/progress";
    const secondaryAttempt = attemptedItems.find(
        (scenario) => scenario.scenarioSlug !== nextScenario?.scenarioSlug
    ) ?? null;

    return `
        <div class="progress-guidance-shell" data-progress-guidance-shell>
            <div class="progress-guidance-shell__hero" data-progress-guidance-primary>
                <span class="progress-status-marker progress-status-marker--${escapeHtml(primaryMarker)}">рекомендация</span>
                <strong>${escapeHtml(nextScenario?.scenarioTitle ?? "Рекомендация ещё определяется")}</strong>
                <p class="panel-copy">${escapeHtml(recommendations?.rationale ?? "Рекомендация сейчас недоступна.")}</p>
                <div class="lesson-spotlight__meta">
                    <span class="lesson-spotlight__pill">Основное: ${escapeHtml(primaryLabel)}</span>
                    <span class="lesson-spotlight__pill">Решено: ${solvedCount}</span>
                    <span class="lesson-spotlight__pill">С попытками: ${attemptedCount}</span>
                </div>
                <div class="progress-guidance-actions">
                    <a class="scenario-action" href="${escapeHtml(primaryHref)}">${escapeHtml(primaryLabel)}</a>
                    ${secondaryAttempt ? `
                        <a class="scenario-action scenario-action--secondary" href="#/exercise/${encodeHashSegment(secondaryAttempt.scenarioSlug)}">Продолжить начатый сценарий</a>
                    ` : ""}
                </div>
            </div>
            <div class="progress-guidance-groups">
                ${renderProgressRecommendationList({
                    label: "Начатые и активные",
                    title: "Сохраняйте темп в уже начатой работе",
                    items: attemptedItems,
                    emptyCopy: "Сейчас нет частично пройденных сценариев, требующих продолжения.",
                    marker: "in_progress",
                    actionLabel: "Продолжить"
                })}
                ${renderProgressRecommendationList({
                    label: "Решённые и доступные",
                    title: "Возвращайтесь к решённым сценариям для закрепления",
                    items: solvedItems,
                    emptyCopy: "Пока нет решённых сценариев для повторения.",
                    marker: "completed",
                    actionLabel: "Повторить"
                })}
            </div>
            <div class="lesson-spotlight__meta">
                <span class="lesson-spotlight__pill">Решено: ${solvedCount}</span>
                <span class="lesson-spotlight__pill">С попытками: ${attemptedCount}</span>
                <span class="lesson-spotlight__pill">Следующий шаг: ${nextScenario ? "готов" : "ожидание"}</span>
            </div>
        </div>
    `;
}

function renderProgressRecommendationList({
    label,
    title,
    items,
    emptyCopy,
    marker,
    actionLabel
}) {
    return `
        <section class="progress-guidance-group" data-progress-recommendation-list="${escapeHtml(label)}">
            <div class="lesson-section__header">
                <span class="control-label">${escapeHtml(label)}</span>
                <h5 class="lesson-block__title">${escapeHtml(title)}</h5>
            </div>
            ${items.length > 0 ? `
                <div class="progress-guidance-list">
                    ${items.map((item) => renderProgressRecommendationCard(item, { marker, actionLabel })).join("")}
                </div>
            ` : `
                <p class="panel-copy">${escapeHtml(emptyCopy)}</p>
            `}
        </section>
    `;
}

function renderProgressRecommendationCard(item, { marker, actionLabel }) {
    return `
        <article class="progress-recommendation-card">
            <div class="progress-card__header">
                <span class="progress-status-marker progress-status-marker--${escapeHtml(marker)}">${escapeHtml(formatProgressStatus(marker))}</span>
                <span class="lesson-spotlight__pill">${escapeHtml(item.scenarioSlug)}</span>
            </div>
            <strong>${escapeHtml(item.scenarioTitle)}</strong>
            <div class="progress-guidance-actions">
                <a class="scenario-action scenario-action--secondary" href="#/exercise/${encodeHashSegment(item.scenarioSlug)}">${escapeHtml(actionLabel)}</a>
            </div>
        </article>
    `;
}

function renderExerciseMainPanelContent(state) {
    const detail = state.detail.data;

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return `
            ${renderMainLead({
                label: "Сфокусированный урок",
                title: "Загружаем описание задания",
                description: "Центральная колонка показывает страницу, выбранную в левой навигации.",
                meta: [
                    `Маршрут: ${formatRoute(state.route)}`,
                    `Детали: ${formatCatalogStatus(state.detail.status)}`
                ]
            })}
            <section class="lesson-spotlight lesson-spotlight--loading">
                <span class="control-label">Состояние урока</span>
                <h4 class="lesson-block__title">Ждём описание задания</h4>
                <p class="panel-copy">Оболочка страницы уже на месте. Выбранная страница задания всё ещё загружается.</p>
            </section>
        `;
    }

    if (state.detail.status === "error") {
        return `
            ${renderMainLead({
                label: "Сфокусированный урок",
                title: "Детали упражнения недоступны",
                description: "Не удалось загрузить выбранную страницу задания.",
                meta: [
                    `Источник: ${formatProviderName(state.providerName)}`,
                    "Детали: ошибка"
                ]
            })}
            <section class="lesson-block">
                <h4 class="lesson-block__title">Запрошенный маршрут</h4>
                <dl class="result-summary">
                    <div>
                        <dt>Код сценария</dt>
                        <dd>${escapeHtml(state.selectedScenarioSlug ?? "неизвестно")}</dd>
                    </div>
                    <div>
                        <dt>Источник</dt>
                        <dd>${escapeHtml(formatProviderName(state.providerName))}</dd>
                    </div>
                    <div>
                        <dt>Ошибка</dt>
                        <dd>${escapeHtml(state.detail.error ?? "Неизвестная ошибка деталей сценария")}</dd>
                    </div>
                </dl>
                ${renderProviderRecoveryNotice(state.providerName, { route: "exercise" })}
            </section>
        `;
    }

    const focusedContent = resolveFocusedLessonContent(detail, state.selectedFocus);

    return `
        ${renderMainLead({
            label: detail.workspace.shell.centerPanelTitle,
            title: focusedContent.title,
            description: focusedContent.description,
            meta: [
                `Задача: ${formatTaskStatus(detail.workspace.task.status)}`,
                `Сложность: ${formatDifficulty(detail.difficulty)}`,
                `Страница: ${focusedContent.metaLabel}`
            ]
        })}
        ${focusedContent.body}
    `;
}

function renderWelcomePage(state, { tagOptions, providerOptions }) {
    return `
        <section class="lesson-spotlight">
            <span class="control-label">Приветствие</span>
            <h4 class="lesson-block__title">Практикуйте Git на одном экране</h4>
            <p class="panel-copy">Левая колонка управляет навигацией. Выберите там блок задания, чтобы открыть его здесь и не уходить с этого экрана.</p>
            <div class="lesson-spotlight__meta">
                <span class="lesson-spotlight__pill">Задания: ${state.catalog.items.length}</span>
                <span class="lesson-spotlight__pill">Маршрут: ${formatRoute(state.route)}</span>
            </div>
        </section>
        ${renderCatalogControlPanel(state, { tagOptions, providerOptions })}
        ${renderProviderModeNotice(state.providerName)}
        <section class="lesson-block lesson-block--reading">
            <div class="lesson-section__header">
                <span class="control-label">Цикл</span>
                <h4 class="lesson-block__title">Как пользоваться этим экраном</h4>
            </div>
            <ol class="task-sequence">
                <li class="task-sequence__item">
                    <span class="task-sequence__index">1</span>
                    <div class="task-sequence__copy">
                        <strong>Выберите задание слева</strong>
                        <p>Левая колонка теперь одновременно служит каталогом заданий и навигатором по подзадачам.</p>
                    </div>
                </li>
                <li class="task-sequence__item">
                    <span class="task-sequence__index">2</span>
                    <div class="task-sequence__copy">
                        <strong>Читайте выбранную страницу по центру</strong>
                        <p>Обзор задания и выбранный шаг открываются здесь, а не на отдельной странице.</p>
                    </div>
                </li>
                <li class="task-sequence__item">
                    <span class="task-sequence__index">3</span>
                    <div class="task-sequence__copy">
                        <strong>Продолжайте практику справа</strong>
                        <p>Правая колонка остаётся открытой для просмотра состояния репозитория и подготовки ответа.</p>
                    </div>
                </li>
            </ol>
        </section>
    `;
}

function renderCatalogControlPanel(state, { tagOptions, providerOptions }) {
    return `
        <section class="lesson-block lesson-block--reading catalog-controls">
            <div class="lesson-section__header">
                <span class="control-label">Управление каталогом</span>
                <h4 class="lesson-block__title">Фильтруйте сценарии и при необходимости меняйте источник</h4>
            </div>
            <form class="catalog-controls__form" data-catalog-controls-form>
                <div class="catalog-controls__grid">
                    <label class="catalog-controls__field">
                        <span class="control-label">Источник</span>
                        <select name="providerName">
                            ${providerOptions.map((providerName) => `
                                <option value="${escapeHtml(providerName)}"${providerName === state.providerName ? " selected" : ""}>${escapeHtml(formatProviderOptionLabel(providerName))}</option>
                            `).join("")}
                        </select>
                        <span class="catalog-controls__field-note">${escapeHtml(describeProviderSelection(state.providerName))}</span>
                    </label>
                    <label class="catalog-controls__field">
                        <span class="control-label">Сложность</span>
                        <select name="difficulty">
                            <option value="">Все уровни</option>
                            <option value="beginner"${state.query.difficulty === "beginner" ? " selected" : ""}>Начальный</option>
                            <option value="intermediate"${state.query.difficulty === "intermediate" ? " selected" : ""}>Средний</option>
                        </select>
                    </label>
                    <label class="catalog-controls__field">
                        <span class="control-label">Сортировка</span>
                        <select name="sort">
                            <option value="">По названию</option>
                            <option value="difficulty"${state.query.sort === "difficulty" ? " selected" : ""}>По сложности</option>
                        </select>
                    </label>
                </div>
                <fieldset class="catalog-controls__tags">
                    <legend class="control-label">Теги</legend>
                    <div class="catalog-controls__tag-list">
                        ${tagOptions.map((tag) => `
                            <label class="catalog-controls__tag-option">
                                <input
                                    type="checkbox"
                                    name="tags"
                                    value="${escapeHtml(tag)}"${state.query.tags.includes(tag) ? " checked" : ""}
                                >
                                <span>${escapeHtml(formatTag(tag))}</span>
                            </label>
                        `).join("")}
                    </div>
                </fieldset>
                <div class="catalog-controls__actions">
                    <button class="scenario-action scenario-action--muted" type="button" data-reset-catalog-controls>Сбросить фильтры</button>
                    <span class="catalog-controls__summary">
                        ${escapeHtml(describeCatalogQuery(state))}
                    </span>
                </div>
            </form>
            ${renderProviderRecoveryNotice(state.providerName, { route: "catalog" })}
        </section>
    `;
}

function describeCatalogQuery(state) {
    const activeParts = [];
    if (state.query.difficulty) {
        activeParts.push(`сложность: ${formatDifficulty(state.query.difficulty)}`);
    }
    if (state.query.sort) {
        activeParts.push(`сортировка: ${state.query.sort === "difficulty" ? "по сложности" : state.query.sort}`);
    }
    if (state.query.tags.length) {
        activeParts.push(`теги: ${state.query.tags.map((tag) => formatTag(tag)).join(", ")}`);
    }

    const queryLabel = activeParts.length ? activeParts.join(" | ") : "активных фильтров нет";
    return `Источник: ${formatProviderName(state.providerName)} | ${queryLabel}`;
}

function describeProviderSelection(providerName) {
    if (providerName === "backend-api") {
        return "Основной demo flow идёт через сервер. Диагностические режимы оставлены только для локальной проверки и fallback.";
    }

    if (providerName === "local-fixture") {
        return "Диагностический режим с локальными данными. Основной пользовательский путь продолжает идти через сервер.";
    }

    if (providerName === "fixture-unavailable") {
        return "Диагностический режим для проверки recovery UX при недоступном источнике.";
    }

    return "Источник выбран вручную для текущего сеанса каталога.";
}

function renderProviderModeNotice(providerName) {
    if (providerName === "backend-api") {
        return `
            <section class="lesson-block lesson-block--reading">
                <div class="lesson-section__header">
                    <span class="control-label">Источник по умолчанию</span>
                    <h4 class="lesson-block__title">Backend API остаётся основным пользовательским путём</h4>
                </div>
                <p class="panel-copy">Каталог, детали сценария, запуск сессии и прогресс по умолчанию идут через единый backend-поток. Fixture-режимы сохранены только для диагностики и fallback-проверок.</p>
            </section>
        `;
    }

    return `
        <section class="lesson-block lesson-block--reading">
            <div class="lesson-section__header">
                <span class="control-label">Диагностический режим</span>
                <h4 class="lesson-block__title">Сейчас выбран не основной источник</h4>
            </div>
            <div class="practice-inline-note practice-inline-note--warning">
                <p class="panel-copy">${escapeHtml(describeProviderSelection(providerName))}</p>
            </div>
        </section>
    `;
}

function renderProviderRecoveryNotice(providerName, { route }) {
    if (providerName === "backend-api") {
        const recoveryCopy = route === "catalog"
            ? "Если сервер временно недоступен, используйте селектор «Источник» на этом экране и переключитесь на локальные фикстуры только для диагностики или dev-проверки."
            : "Если сервер временно недоступен, вернитесь в каталог и через селектор «Источник» переключитесь на локальные фикстуры только для диагностики или dev-проверки.";
        return `
            <div class="practice-inline-note practice-inline-note--warning">
                <p class="panel-copy">${escapeHtml(recoveryCopy)}</p>
            </div>
        `;
    }

    if (!isDiagnosticProvider(providerName)) {
        return "";
    }

    const returnLabel = route === "catalog"
        ? "Основной поток доступен через источник «Сервер»."
        : "Вернитесь в каталог, когда захотите снова пойти по основному пути.";

    return `
        <div class="practice-inline-note practice-inline-note--warning">
            <p class="panel-copy">${escapeHtml(returnLabel)} Текущий источник оставлен как резервный диагностический режим и не считается основным пользовательским сценарием.</p>
        </div>
    `;
}

function resolveFocusedLessonContent(detail, selectedFocus) {
    const normalizedFocus = selectedFocus === "overview" ? null : selectedFocus;
    const selectedStep = normalizeTaskSteps(detail).find((step) => `step-${step.position}` === normalizedFocus);
    if (selectedStep) {
        return {
            title: selectedStep.title,
            description: selectedStep.detail,
            metaLabel: `подзадача ${selectedStep.position}`,
            body: `
                <section class="lesson-spotlight">
                    <span class="control-label">Подзадача ${selectedStep.position}</span>
                    <h4 class="lesson-block__title">${escapeHtml(selectedStep.title)}</h4>
                    <p class="panel-copy">${escapeHtml(selectedStep.detail)}</p>
                </section>
                <section class="lesson-block lesson-block--reading">
                    <div class="lesson-section__header">
                        <span class="control-label">Зачем нужен этот шаг</span>
                        <h4 class="lesson-block__title">Контекст шага</h4>
                    </div>
                    <div class="task-annotations">
                        ${normalizeTaskAnnotations(detail).map((annotation) => `
                            <article class="task-annotation">
                                <span class="control-label">${escapeHtml(annotation.label)}</span>
                                <p>${escapeHtml(annotation.message)}</p>
                            </article>
                        `).join("")}
                    </div>
                </section>
            `
        };
    }

    return {
        title: detail.title,
        description: detail.workspace.task.goal,
        metaLabel: "обзор",
        body: `
            <section class="lesson-spotlight">
                <span class="control-label">Сфокусированный урок</span>
                <h4 class="lesson-block__title">Цель задания</h4>
                <p class="panel-copy">${escapeHtml(detail.workspace.task.goal)}</p>
                <div class="lesson-spotlight__meta">
                    <span class="lesson-spotlight__pill">Инструкции: ${normalizeTaskInstructions(detail).length}</span>
                    <span class="lesson-spotlight__pill">Шаги: ${normalizeTaskSteps(detail).length}</span>
                    <span class="lesson-spotlight__pill">Аннотации: ${normalizeTaskAnnotations(detail).length}</span>
                </div>
            </section>
            <section class="lesson-block lesson-block--reading">
                <div class="lesson-section__header">
                    <span class="control-label">Сначала прочитайте</span>
                    <h4 class="lesson-block__title">Поток инструкций</h4>
                </div>
                <ol class="task-sequence">
                    ${normalizeTaskInstructions(detail).map((instruction, index) => `
                        <li class="task-sequence__item">
                            <span class="task-sequence__index">${index + 1}</span>
                            <div class="task-sequence__copy">
                                <strong>${escapeHtml(instruction.id)}</strong>
                                <p>${escapeHtml(instruction.text)}</p>
                            </div>
                        </li>
                    `).join("")}
                </ol>
            </section>
            <section class="lesson-block lesson-block--reading">
                <div class="lesson-section__header">
                    <span class="control-label">Следом</span>
                    <h4 class="lesson-block__title">Порядок шагов</h4>
                </div>
                <ol class="task-steps">
                    ${normalizeTaskSteps(detail).map((step) => `
                        <li class="task-steps__item">
                            <div class="task-steps__header">
                                <span class="task-step__position">Шаг ${step.position}</span>
                                <strong>${escapeHtml(step.title)}</strong>
                            </div>
                            <p>${escapeHtml(step.detail)}</p>
                        </li>
                    `).join("")}
                </ol>
            </section>
        `
    };
}

function renderMainLead({ label, title, description, meta }) {
    return `
        <section class="lesson-lead">
            <div class="lesson-lead__heading">
                <p class="panel-label">${escapeHtml(label)}</p>
                <h3>${escapeHtml(title)}</h3>
                <p class="panel-copy">${escapeHtml(description)}</p>
            </div>
            <div class="lesson-lead__meta">
                ${meta.map((item) => `<span class="lesson-lead__meta-item">${escapeHtml(item)}</span>`).join("")}
            </div>
        </section>
    `;
}

function formatCatalogStatus(value) {
    switch (value) {
        case "idle":
            return "ожидание";
        case "loading":
            return "загрузка";
        case "ready":
            return "готово";
        case "empty":
            return "пусто";
        case "error":
            return "ошибка";
        case "missing":
            return "не найдено";
        default:
            return value ?? "неизвестно";
    }
}

function formatRoute(value) {
    switch (value) {
        case "catalog":
            return "каталог";
        case "progress":
            return "прогресс";
        case "exercise":
            return "упражнение";
        default:
            return value ?? "неизвестно";
    }
}

function formatTaskStatus(value) {
    switch (value) {
        case "authored-fixture":
            return "локальная фикстура";
        default:
            return value ?? "неизвестно";
    }
}

function declineAttempt(count) {
    return count === 1 ? "попытка" : count >= 2 && count <= 4 ? "попытки" : "попыток";
}

function declineCompletion(count) {
    return count === 1 ? "завершение" : count >= 2 && count <= 4 ? "завершения" : "завершений";
}

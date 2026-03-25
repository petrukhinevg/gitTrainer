import { renderLessonLane } from "./lesson-layout.js";
import {
    isSandboxScenarioSlug,
    isSandboxShortcutActive,
    SANDBOX_ROUTE_HASH
} from "../sandbox-route.js";
import {
    encodeHashSegment,
    escapeHtml,
    formatTag
} from "./render-helpers.js";

export function renderSidebarPanel(state, _selectedCatalogScenario, tagOptions = []) {
    return renderLessonLane({
        lane: "navigation",
        label: resolveLeftPanelTitle(state),
        title: "Маршрут тренировки",
        description: "Левая колонка теперь ведёт весь поток: старт, сценарии и подзадачи активного упражнения.",
        showHeader: false,
        body: renderSidebarPanelContent(state, _selectedCatalogScenario, tagOptions)
    });
}

export function renderSidebarPanelContent(state, _selectedCatalogScenario, tagOptions = []) {
    return renderTrainingFlow(state, tagOptions);
}

function resolveLeftPanelTitle(state) {
    if (state.route === "exercise" && state.detail.status === "ready") {
        return state.detail.data.workspace.shell.leftPanelTitle;
    }

    return "Навигация";
}

function renderTrainingFlow(state, tagOptions) {
    if (state.catalog.status === "loading" || state.catalog.status === "idle") {
        return `
            <section class="lesson-rail__summary">
                <span class="control-label">Загрузка</span>
                <strong>Подготавливаем блоки заданий</strong>
                <p class="panel-copy">Левая колонка ждёт список сценариев, чтобы построить маршрут тренировки.</p>
            </section>
        `;
    }

    if (state.catalog.status === "error") {
        const recoveryCopy = "Серверный каталог недоступен. Проверьте, что backend запущен, а приложение открыто через локальный HTTP-сервер.";
        return `
            <section class="lesson-rail__summary">
                <span class="control-label">Ошибка</span>
                <strong>Блоки заданий недоступны</strong>
                <p class="panel-copy">${escapeHtml(state.catalog.error ?? "Неизвестная ошибка каталога")}</p>
                <p class="panel-copy">${escapeHtml(recoveryCopy)}</p>
            </section>
        `;
    }

    const activeFilterTag = toTagToken(state.heldNavigationTag);
    const hasExpandedScenarios = state.expandedScenarioSlugs.length > 0;
    const canRestoreCollapsedScenarios = !hasExpandedScenarios
        && Array.isArray(state.collapsedNavigationScenarioSnapshot)
        && state.collapsedNavigationScenarioSnapshot.length > 0;

    return `
        <div class="tag-connection-map" data-tag-connection-map>
            <div class="scenario-legend">
                ${renderLegendGuide(state.isNavigationTagGuideExpanded)}
                <div class="scenario-legend__tags">
                    ${renderLegendTagRows(tagOptions, state.pinnedNavigationTag, state.heldNavigationTag)}
                </div>
            </div>
            ${renderScenarioFlowDivider({ hasExpandedScenarios, canRestoreCollapsedScenarios })}
            <div class="flow-block-list" data-flow-block-list>
                ${renderWelcomeFlowBlock(state)}
                ${renderProgressFlowBlock(state)}
                ${renderSandboxFlowBlock(state)}
                ${state.catalog.items
                    .filter((item) => !isSandboxScenarioSlug(item.slug))
                    .map((item, index) => renderScenarioFlowBlock({
                    state,
                    item,
                    index,
                    activeFilterTag,
                    isActive: item.slug === state.selectedScenarioSlug,
                    selectedFocus: state.selectedFocus
                })).join("")}
            </div>
        </div>
    `;
}

function renderLegendGuide(isExpanded) {
    const expanded = Boolean(isExpanded);

    return `
        <div class="scenario-legend__guide" data-navigation-tag-guide="${expanded ? "expanded" : "collapsed"}">
            <button
                class="scenario-legend__guide-toggle"
                type="button"
                data-navigation-tag-guide-toggle
                aria-expanded="${expanded ? "true" : "false"}"
                aria-controls="navigation-tag-guide-panel"
            >
                <span class="scenario-legend__guide-toggle-label">Как работать с тегами</span>
                <span class="scenario-legend__guide-toggle-icon" aria-hidden="true">></span>
            </button>
            <div
                class="scenario-legend__guide-panel"
                id="navigation-tag-guide-panel"
                data-navigation-tag-guide-panel
                aria-hidden="${expanded ? "false" : "true"}"
            >
                <div class="scenario-legend__guide-content">
                    <p class="panel-copy">Теги управляют подсветкой и фильтрацией сценариев в левой колонке.</p>
                    <ul class="scenario-legend__guide-list">
                        <li><strong>Наведение</strong> подсвечивает связанные задания и ветки, не меняя выбранное состояние.</li>
                        <li><strong>Левая кнопка мыши</strong> закрепляет тег. Повторное нажатие снимает закрепление.</li>
                        <li><strong>Средняя кнопка мыши</strong> включает удержание тега и фильтрует список по нему. Повторное нажатие возвращает прежний вид.</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function renderScenarioFlowDivider({ hasExpandedScenarios, canRestoreCollapsedScenarios }) {
    const isDisabled = !hasExpandedScenarios && !canRestoreCollapsedScenarios;
    const buttonLabel = canRestoreCollapsedScenarios ? "Вернуть раскрытие" : "Свернуть всё";
    const buttonState = canRestoreCollapsedScenarios ? "restore" : "collapse";

    return `
        <div class="scenario-flow-divider">
            <span class="scenario-flow-divider__line" aria-hidden="true"></span>
            <button
                class="scenario-flow-divider__toggle"
                type="button"
                data-navigation-collapse-all-toggle="${buttonState}"
                aria-label="${buttonLabel}"
                title="${buttonLabel}"${isDisabled ? " disabled" : ""}
            >
                ${canRestoreCollapsedScenarios ? "+" : "-"}
            </button>
        </div>
    `;
}

function renderLegendTagRows(tagOptions, pinnedNavigationTag, heldNavigationTag) {
    const rows = resolveLegendTagRows(tagOptions);

    return rows.map((row) => `
        <div class="scenario-legend__row">
            ${row.map((tag) => renderLegendTag(tag, pinnedNavigationTag, heldNavigationTag)).join("")}
        </div>
    `).join("");
}

function resolveLegendTagRows(tagOptions) {
    const preferredRows = [
        ["cleanup", "working-tree"],
        ["basics", "branching"],
        ["history", "planning"],
        ["status", "remote"],
        ["inspection", "navigation"]
    ];
    const availableTags = new Set(tagOptions);
    const rows = [];

    for (const row of preferredRows) {
        const resolvedRow = row.filter((tag) => availableTags.has(tag));

        if (resolvedRow.length === 0) {
            continue;
        }

        resolvedRow.forEach((tag) => availableTags.delete(tag));
        rows.push(resolvedRow);
    }

    const remainingTags = tagOptions.filter((tag) => availableTags.has(tag));

    for (let index = 0; index < remainingTags.length; index += 2) {
        rows.push(remainingTags.slice(index, index + 2));
    }

    return rows;
}

function renderWelcomeFlowBlock(state) {
    const isActive = state.route === "catalog";
    return `
        <a class="flow-block ${isActive ? "flow-block--active" : ""}" href="#/catalog">
            <span class="flow-block__eyebrow">Старт</span>
            <strong class="flow-block__title">Начать здесь</strong>
        </a>
    `;
}

function renderProgressFlowBlock(state) {
    const isActive = state.route === "progress";
    return `
        <a class="flow-block ${isActive ? "flow-block--active" : ""}" href="#/progress">
            <span class="flow-block__eyebrow">Прогресс</span>
            <strong class="flow-block__title">Посмотреть статус практики</strong>
        </a>
    `;
}

function renderSandboxFlowBlock(state) {
    const isActive = isSandboxShortcutActive(state);
    return `
        <a class="flow-block ${isActive ? "flow-block--active" : ""}" href="${SANDBOX_ROUTE_HASH}">
            <span class="flow-block__eyebrow">Песочница</span>
            <strong class="flow-block__title">Свободно потренироваться</strong>
        </a>
    `;
}

function renderScenarioFlowBlock({ state, item, index, activeFilterTag, isActive, selectedFocus }) {
    const isExpanded = state.expandedScenarioSlugs.includes(item.slug);
    const shouldAnimateSubtasks = resolveExpandingScenarioSlugs(state).includes(item.slug);
    const navigationDetail = resolveNavigationDetail(state, item.slug);
    const tagTokens = item.tags.map(toTagToken);
    const matchesActiveFilter = !activeFilterTag || tagTokens.includes(activeFilterTag);
    const subtaskBlocks = isExpanded
        ? `
            <div
                class="flow-subtask-region"
                id="flow-subtasks-${encodeHashSegment(item.slug)}"
                data-scenario-panel="${escapeHtml(item.slug)}"
            >
                ${renderExpandedScenarioContent(
                    item.slug,
                    navigationDetail,
                    selectedFocus,
                    isActive,
                    shouldAnimateSubtasks
                )}
            </div>
        `
        : "";
    const filteredStateAttributes = matchesActiveFilter
        ? 'data-flow-node-filtered="false" data-flow-node-tag-match="true"'
        : 'data-flow-node-filtered="true" data-flow-node-tag-match="false" aria-hidden="true" inert';

    return `
        <section
            class="flow-node"
            data-tags="${escapeHtml(tagTokens.join(" "))}"
            ${filteredStateAttributes}
        >
            <div class="flow-node__body">
                <button
                    class="flow-block flow-block--toggle ${isActive ? "flow-block--active" : ""}"
                    type="button"
                    data-scenario-toggle="${encodeHashSegment(item.slug)}"
                    data-tag-connection-target="${escapeHtml(tagTokens.join(" "))}"
                    aria-expanded="${isExpanded ? "true" : "false"}"
                    aria-controls="flow-subtasks-${encodeHashSegment(item.slug)}"
                >
                    <span class="flow-block__heading">
                        <span class="flow-block__eyebrow">Задание ${index + 1}</span>
                        <span class="flow-block__indicator" aria-hidden="true">${isExpanded ? "v" : ">"}</span>
                    </span>
                    <strong class="flow-block__title">${escapeHtml(item.title)}</strong>
                    ${renderScenarioTagAccessibilityText(item.tags)}
                </button>
                ${subtaskBlocks}
            </div>
        </section>
    `;
}

function resolveExpandingScenarioSlugs(state) {
    if (Array.isArray(state.expandingScenarioSlugs)) {
        return state.expandingScenarioSlugs;
    }

    return state.expandingScenarioSlug ? [state.expandingScenarioSlug] : [];
}

function renderExpandedScenarioContent(
    slug,
    navigationDetail,
    selectedFocus,
    isActiveScenario,
    shouldAnimateSubtasks
) {
    if (!navigationDetail || navigationDetail.status === "idle" || navigationDetail.status === "loading") {
        return `
            <div class="flow-subtask-group">
                <div class="flow-subtask-placeholder" ${renderFlowSubtaskEnterStyle(0, shouldAnimateSubtasks)}>
                    <span class="flow-block__eyebrow">Загрузка</span>
                    <strong class="flow-block__title">Подготавливаем подзадачи</strong>
                </div>
            </div>
        `;
    }

    if (navigationDetail.status === "error") {
        return `
            <div class="flow-subtask-group">
                <div
                    class="flow-subtask-placeholder flow-subtask-placeholder--error"
                    ${renderFlowSubtaskEnterStyle(0, shouldAnimateSubtasks)}
                >
                    <span class="flow-block__eyebrow">Недоступно</span>
                    <strong class="flow-block__title">${escapeHtml(navigationDetail.error ?? "Подзадачи недоступны")}</strong>
                </div>
            </div>
        `;
    }

    const stepBlocks = navigationDetail.data.workspace.task.steps.map((step, index) => (
        renderSubtaskFlowBlock(
            slug,
            step,
            selectedFocus,
            isActiveScenario,
            index + 1,
            shouldAnimateSubtasks
        )
    )).join("");

    return `
        <div class="flow-subtask-group">
            ${renderOverviewFlowBlock(
                slug,
                selectedFocus,
                isActiveScenario,
                0,
                shouldAnimateSubtasks
            )}
            ${stepBlocks}
        </div>
    `;
}

function resolveNavigationDetail(state, slug) {
    if (slug === state.detail.scenarioSlug && state.detail.status !== "idle") {
        return {
            status: state.detail.status,
            data: state.detail.data,
            error: state.detail.error
        };
    }

    return state.detailCache[slug] ?? {
        status: "idle",
        data: null,
        error: null
    };
}

function renderOverviewFlowBlock(
    slug,
    selectedFocus,
    isActiveScenario,
    enterIndex,
    shouldAnimateSubtasks
) {
    const focusId = "overview";
    return `
        <a
            class="flow-block flow-block--subtask ${(isActiveScenario && (selectedFocus === null || selectedFocus === focusId)) ? "flow-block--active" : ""}"
            href="#/exercise/${encodeHashSegment(slug)}?focus=${focusId}"
            data-scenario-focus="${escapeHtml(focusId)}"
            data-tag-branch-target="true"
            ${renderFlowSubtaskEnterStyle(enterIndex, shouldAnimateSubtasks)}
        >
            <strong class="flow-block__title">Обзор</strong>
        </a>
    `;
}

function renderSubtaskFlowBlock(
    slug,
    step,
    selectedFocus,
    isActiveScenario,
    enterIndex,
    shouldAnimateSubtasks
) {
    const focusId = `step-${step.position}`;
    return `
        <a
            class="flow-block flow-block--subtask ${(isActiveScenario && selectedFocus === focusId) ? "flow-block--active" : ""}"
            href="#/exercise/${encodeHashSegment(slug)}?focus=${encodeHashSegment(focusId)}"
            data-scenario-focus="${escapeHtml(focusId)}"
            data-tag-branch-target="true"
            ${renderFlowSubtaskEnterStyle(enterIndex, shouldAnimateSubtasks)}
        >
            <strong class="flow-block__title">${escapeHtml(step.title)}</strong>
        </a>
    `;
}

function renderLegendTag(tag, pinnedNavigationTag, heldNavigationTag) {
    const token = toTagToken(tag);
    const isPinned = pinnedNavigationTag === token;
    const isHeld = heldNavigationTag === token;
    return `
        <button
            class="scenario-legend__tag scenario-legend__tag--${escapeHtml(token)} ${(isPinned || isHeld) ? "scenario-legend__tag--active" : ""}"
            type="button"
            data-tag-legend-control="${escapeHtml(token)}"
            aria-pressed="${(isPinned || isHeld) ? "true" : "false"}"
        >
            <span class="scenario-legend__swatch" aria-hidden="true"></span>
            <span>${escapeHtml(formatTag(tag))}</span>
        </button>
    `;
}

function renderScenarioTagAccessibilityText(tags) {
    const formattedTags = tags
        .map((tag) => formatTag(tag))
        .filter(Boolean)
        .join(", ");

    if (!formattedTags) {
        return "";
    }

    return `<span class="flow-block__sr-tags">Теги: ${escapeHtml(formattedTags)}</span>`;
}

function renderFlowSubtaskEnterStyle(index, shouldAnimate) {
    if (!shouldAnimate) {
        return "";
    }

    return `data-flow-subtask-enter="true" style="--flow-subtask-enter-index: ${escapeHtml(index)}"`;
}

function toTagToken(tag) {
    return String(tag ?? "")
        .trim()
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "");
}

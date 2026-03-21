import { renderLessonLane } from "./lesson-layout.js";
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
        const recoveryCopy = state.providerName === "backend-api"
            ? "Серверный каталог недоступен. В центральной колонке переключите источник на локальные фикстуры, если нужно продолжить диагностику."
            : "Сменить источник можно в центральной колонке, не покидая этот экран.";
        return `
            <section class="lesson-rail__summary">
                <span class="control-label">Ошибка</span>
                <strong>Блоки заданий недоступны</strong>
                <p class="panel-copy">${escapeHtml(state.catalog.error ?? "Неизвестная ошибка каталога")}</p>
                <p class="panel-copy">${escapeHtml(recoveryCopy)}</p>
            </section>
        `;
    }

    return `
        <div class="tag-connection-map" data-tag-connection-map>
            <div class="scenario-legend">
                <div class="scenario-legend__tags">
                    ${tagOptions.map((tag) => renderLegendTag(tag, state.pinnedNavigationTag)).join("")}
                </div>
            </div>
            <div class="flow-block-list" data-flow-block-list>
                ${renderWelcomeFlowBlock(state)}
                ${renderProgressFlowBlock(state)}
                ${state.catalog.items.map((item, index) => renderScenarioFlowBlock({
                    state,
                    item,
                    index,
                    isActive: item.slug === state.selectedScenarioSlug,
                    selectedFocus: state.selectedFocus
                })).join("")}
            </div>
        </div>
    `;
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

function renderScenarioFlowBlock({ state, item, index, isActive, selectedFocus }) {
    const isExpanded = state.expandedScenarioSlugs.includes(item.slug);
    const navigationDetail = resolveNavigationDetail(state, item.slug);
    const tagTokens = item.tags.map(toTagToken);
    const subtaskBlocks = isExpanded
        ? `
            <div
                class="flow-subtask-region"
                id="flow-subtasks-${encodeHashSegment(item.slug)}"
                data-scenario-panel="${escapeHtml(item.slug)}"
            >
                ${renderExpandedScenarioContent(item.slug, navigationDetail, selectedFocus, isActive, tagTokens)}
            </div>
        `
        : "";

    return `
        <section class="flow-node" data-tags="${escapeHtml(tagTokens.join(" "))}">
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
        </section>
    `;
}

function renderExpandedScenarioContent(slug, navigationDetail, selectedFocus, isActiveScenario, tagTokens) {
    if (!navigationDetail || navigationDetail.status === "idle" || navigationDetail.status === "loading") {
        return `
            <div class="flow-subtask-group">
                <div class="flow-subtask-placeholder">
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
                >
                    <span class="flow-block__eyebrow">Недоступно</span>
                    <strong class="flow-block__title">${escapeHtml(navigationDetail.error ?? "Подзадачи недоступны")}</strong>
                </div>
            </div>
        `;
    }

    return `
        <div class="flow-subtask-group">
            ${renderOverviewFlowBlock(slug, selectedFocus, isActiveScenario, tagTokens)}
            ${navigationDetail.data.workspace.task.steps.map((step) => (
                renderSubtaskFlowBlock(slug, step, selectedFocus, isActiveScenario, tagTokens)
            )).join("")}
        </div>
    `;
}

function resolveNavigationDetail(state, slug) {
    if (slug === state.selectedScenarioSlug && state.detail.status !== "idle") {
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

function renderOverviewFlowBlock(slug, selectedFocus, isActiveScenario, tagTokens) {
    const focusId = "overview";
    return `
        <a
            class="flow-block flow-block--subtask ${(isActiveScenario && (selectedFocus === null || selectedFocus === focusId)) ? "flow-block--active" : ""}"
            href="#/exercise/${encodeHashSegment(slug)}?focus=${focusId}"
            data-tag-branch-target="true"
        >
            <span class="flow-block__eyebrow">Страница задания</span>
            <strong class="flow-block__title">Обзор</strong>
        </a>
    `;
}

function renderSubtaskFlowBlock(slug, step, selectedFocus, isActiveScenario, tagTokens) {
    const focusId = `step-${step.position}`;
    return `
        <a
            class="flow-block flow-block--subtask ${(isActiveScenario && selectedFocus === focusId) ? "flow-block--active" : ""}"
            href="#/exercise/${encodeHashSegment(slug)}?focus=${encodeHashSegment(focusId)}"
            data-tag-branch-target="true"
        >
            <span class="flow-block__eyebrow">Подзадача ${step.position}</span>
            <strong class="flow-block__title">${escapeHtml(step.title)}</strong>
        </a>
    `;
}

function renderLegendTag(tag, pinnedNavigationTag) {
    const token = toTagToken(tag);
    const isPinned = pinnedNavigationTag === token;
    return `
        <button
            class="scenario-legend__tag scenario-legend__tag--${escapeHtml(token)} ${isPinned ? "scenario-legend__tag--active" : ""}"
            type="button"
            data-tag-legend-control="${escapeHtml(token)}"
            aria-pressed="${isPinned ? "true" : "false"}"
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

function toTagToken(tag) {
    return String(tag ?? "")
        .trim()
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "");
}

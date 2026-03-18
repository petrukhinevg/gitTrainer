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
        body: renderTrainingFlow(state, tagOptions)
    });
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
        return `
            <section class="lesson-rail__summary">
                <span class="control-label">Ошибка</span>
                <strong>Блоки заданий недоступны</strong>
                <p class="panel-copy">${escapeHtml(state.catalog.error ?? "Неизвестная ошибка каталога")}</p>
            </section>
        `;
    }

    const tagLaneMap = createTagLaneMap(tagOptions);
    const tagSpanMap = createTagSpanMap(state.catalog.items);

    return `
        <div class="scenario-legend">
            <div class="scenario-legend__header">
                <span class="control-label">Карта тегов</span>
                <details class="scenario-legend__details">
                    <summary class="scenario-legend__button" aria-label="Показать пояснение к цветным линиям">i</summary>
                    <div class="scenario-legend__popover">
                        <strong>Пояснение к цветным линиям</strong>
                        <p class="panel-copy">Наведите на тег, чтобы подсветить связанные сценарии в левой колонке. Цветовые линии показывают, какие сценарии сходятся по смысловым тегам.</p>
                    </div>
                </details>
            </div>
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
                tagLaneMap,
                tagSpanMap,
                isActive: item.slug === state.selectedScenarioSlug,
                selectedFocus: state.selectedFocus
            })).join("")}
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

function renderScenarioFlowBlock({ state, item, index, tagLaneMap, tagSpanMap, isActive, selectedFocus }) {
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
                ${renderExpandedScenarioContent(item.slug, navigationDetail, selectedFocus, isActive)}
            </div>
        `
        : "";

    return `
        <section class="flow-node" data-tags="${escapeHtml(tagTokens.join(" "))}">
            <span class="flow-node__graph" aria-hidden="true">
                ${item.tags.map((tag) => renderScenarioTagLine(tag, item.slug, tagLaneMap, tagSpanMap)).join("")}
            </span>
            <button
                class="flow-block flow-block--toggle ${isActive ? "flow-block--active" : ""}"
                type="button"
                data-scenario-toggle="${encodeHashSegment(item.slug)}"
                aria-expanded="${isExpanded ? "true" : "false"}"
                aria-controls="flow-subtasks-${encodeHashSegment(item.slug)}"
            >
                <span class="flow-block__heading">
                    <span class="flow-block__eyebrow">Задание ${index + 1}</span>
                    <span class="flow-block__indicator" aria-hidden="true">${isExpanded ? "v" : ">"}</span>
                </span>
                <strong class="flow-block__title">${escapeHtml(item.title)}</strong>
            </button>
            ${subtaskBlocks}
        </section>
    `;
}

function renderExpandedScenarioContent(slug, navigationDetail, selectedFocus, isActiveScenario) {
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
                <div class="flow-subtask-placeholder flow-subtask-placeholder--error">
                    <span class="flow-block__eyebrow">Недоступно</span>
                    <strong class="flow-block__title">${escapeHtml(navigationDetail.error ?? "Подзадачи недоступны")}</strong>
                </div>
            </div>
        `;
    }

    return `
        <div class="flow-subtask-group">
            ${renderOverviewFlowBlock(slug, selectedFocus, isActiveScenario)}
            ${navigationDetail.data.workspace.task.steps.map((step) => (
                renderSubtaskFlowBlock(slug, step, selectedFocus, isActiveScenario)
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

function renderOverviewFlowBlock(slug, selectedFocus, isActiveScenario) {
    const focusId = "overview";
    return `
        <a
            class="flow-block flow-block--subtask ${(isActiveScenario && (selectedFocus === null || selectedFocus === focusId)) ? "flow-block--active" : ""}"
            href="#/exercise/${encodeHashSegment(slug)}?focus=${focusId}"
        >
            <span class="flow-block__eyebrow">Страница задания</span>
            <strong class="flow-block__title">Обзор</strong>
        </a>
    `;
}

function renderSubtaskFlowBlock(slug, step, selectedFocus, isActiveScenario) {
    const focusId = `step-${step.position}`;
    return `
        <a
            class="flow-block flow-block--subtask ${(isActiveScenario && selectedFocus === focusId) ? "flow-block--active" : ""}"
            href="#/exercise/${encodeHashSegment(slug)}?focus=${encodeHashSegment(focusId)}"
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

function renderScenarioTagLine(tag, slug, tagLaneMap, tagSpanMap) {
    const token = toTagToken(tag);
    const span = tagSpanMap.get(token) ?? {
        firstSlug: slug,
        lastSlug: slug
    };
    const laneIndex = tagLaneMap.get(token) ?? 0;
    const classes = [
        "flow-tag-line",
        `flow-tag-line--${token}`,
        span.firstSlug === slug ? "flow-tag-line--first" : "",
        span.lastSlug === slug ? "flow-tag-line--last" : ""
    ].filter(Boolean).join(" ");
    return `
        <span class="${escapeHtml(classes)}" style="--flow-tag-lane:${laneIndex}">
            <span class="flow-tag-line__stem flow-tag-line__stem--top"></span>
            <span class="flow-tag-line__stem flow-tag-line__stem--bottom"></span>
            <span class="flow-tag-line__node"></span>
            <span class="flow-tag-line__branch"></span>
        </span>
    `;
}

function toTagToken(tag) {
    return String(tag ?? "")
        .trim()
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "");
}

function createTagLaneMap(tagOptions) {
    return new Map(
        tagOptions.map((tag, index) => [toTagToken(tag), index])
    );
}

function createTagSpanMap(items) {
    const tagSpanMap = new Map();

    items.forEach((item) => {
        item.tags.forEach((tag) => {
            const token = toTagToken(tag);
            const existing = tagSpanMap.get(token);
            if (!existing) {
                tagSpanMap.set(token, {
                    firstSlug: item.slug,
                    lastSlug: item.slug
                });
                return;
            }

            existing.lastSlug = item.slug;
        });
    });

    return tagSpanMap;
}

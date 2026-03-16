import { renderLessonLane } from "./lesson-layout.js";
import {
    encodeHashSegment,
    escapeHtml
} from "./render-helpers.js";

export function renderSidebarPanel(state) {
    return renderLessonLane({
        lane: "navigation",
        label: resolveLeftPanelTitle(state),
        title: "Training flow",
        description: "The left lane is now the single navigator: greeting first, then tasks, then sub-tasks for the active scenario.",
        showHeader: false,
        body: renderTrainingFlow(state)
    });
}

function resolveLeftPanelTitle(state) {
    if (state.route === "exercise" && state.detail.status === "ready") {
        return state.detail.data.workspace.shell.leftPanelTitle;
    }

    return "Navigation lane";
}

function renderTrainingFlow(state) {
    if (state.catalog.status === "loading" || state.catalog.status === "idle") {
        return `
            <section class="lesson-rail__summary">
                <span class="control-label">Loading flow</span>
                <strong>Preparing task blocks</strong>
                <p class="panel-copy">The left lane is waiting for the scenario list before it can render the training flow.</p>
            </section>
        `;
    }

    if (state.catalog.status === "error") {
        return `
            <section class="lesson-rail__summary">
                <span class="control-label">Flow error</span>
                <strong>Task blocks are unavailable</strong>
                <p class="panel-copy">${escapeHtml(state.catalog.error ?? "Unknown catalog error")}</p>
            </section>
        `;
    }

    return `
        <div class="flow-block-list">
            ${renderWelcomeFlowBlock(state)}
            ${state.catalog.items.map((item, index) => renderScenarioFlowBlock({
                state,
                item,
                index,
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
            <span class="flow-block__eyebrow">Welcome</span>
            <strong class="flow-block__title">Start here</strong>
        </a>
    `;
}

function renderScenarioFlowBlock({ state, item, index, isActive, selectedFocus }) {
    const isExpanded = state.expandedScenarioSlugs.includes(item.slug);
    const navigationDetail = resolveNavigationDetail(state, item.slug);
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
        <section class="flow-node">
            <button
                class="flow-block flow-block--toggle ${isActive ? "flow-block--active" : ""}"
                type="button"
                data-scenario-toggle="${encodeHashSegment(item.slug)}"
                aria-expanded="${isExpanded ? "true" : "false"}"
                aria-controls="flow-subtasks-${encodeHashSegment(item.slug)}"
            >
                <span class="flow-block__heading">
                    <span class="flow-block__eyebrow">Task ${index + 1}</span>
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
                    <span class="flow-block__eyebrow">Loading</span>
                    <strong class="flow-block__title">Preparing sub-tasks</strong>
                </div>
            </div>
        `;
    }

    if (navigationDetail.status === "error") {
        return `
            <div class="flow-subtask-group">
                <div class="flow-subtask-placeholder flow-subtask-placeholder--error">
                    <span class="flow-block__eyebrow">Unavailable</span>
                    <strong class="flow-block__title">${escapeHtml(navigationDetail.error ?? "Sub-tasks are unavailable")}</strong>
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
            <span class="flow-block__eyebrow">Task page</span>
            <strong class="flow-block__title">Overview</strong>
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
            <span class="flow-block__eyebrow">Sub-task ${step.position}</span>
            <strong class="flow-block__title">${escapeHtml(step.title)}</strong>
        </a>
    `;
}

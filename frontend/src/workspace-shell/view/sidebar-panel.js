import { renderLessonLane } from "./lesson-layout.js";
import { escapeHtml } from "./render-helpers.js";

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

    const activeDetail = state.route === "exercise" && state.detail.status === "ready" ? state.detail.data : null;
    return `
        <div class="flow-block-list">
            ${renderWelcomeFlowBlock(state)}
            ${state.catalog.items.map((item, index) => renderScenarioFlowBlock({
                item,
                index,
                isActive: item.slug === state.selectedScenarioSlug,
                activeDetail,
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

function renderScenarioFlowBlock({ item, index, isActive, activeDetail, selectedFocus }) {
    const subtaskBlocks = isActive && activeDetail
        ? `
            <div class="flow-subtask-group">
                ${activeDetail.workspace.task.steps.map((step) => renderSubtaskFlowBlock(item.slug, step, selectedFocus)).join("")}
            </div>
        `
        : "";

    return `
        <a
            class="flow-block ${isActive ? "flow-block--active" : ""}"
            href="#/exercise/${encodeURIComponent(item.slug)}"
        >
            <span class="flow-block__eyebrow">Task ${index + 1}</span>
            <strong class="flow-block__title">${escapeHtml(item.title)}</strong>
        </a>
        ${subtaskBlocks}
    `;
}

function renderSubtaskFlowBlock(slug, step, selectedFocus) {
    const focusId = `step-${step.position}`;
    return `
        <a
            class="flow-block flow-block--subtask ${selectedFocus === focusId ? "flow-block--active" : ""}"
            href="#/exercise/${encodeURIComponent(slug)}?focus=${encodeURIComponent(focusId)}"
        >
            <span class="flow-block__eyebrow">Sub-task ${step.position}</span>
            <strong class="flow-block__title">${escapeHtml(step.title)}</strong>
        </a>
    `;
}

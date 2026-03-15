import { renderCatalogOverviewState } from "./catalog-surfaces.js";
import { renderLessonLane } from "./lesson-layout.js";
import {
    normalizeTaskAnnotations,
    normalizeTaskInstructions,
    normalizeTaskSteps
} from "./lesson-task.js";
import {
    escapeHtml,
} from "./render-helpers.js";

export function renderMainPanel(state) {
    if (state.route === "exercise") {
        return renderExerciseMainPanel(state);
    }

    return renderLessonLane({
        lane: "lesson",
        label: "Lesson lane",
        title: "Catalog overview now occupies the center lesson column",
        description: describeCatalogStatus(state).description,
        meta: [
            `Status: ${state.catalog.status}`,
            `Scenarios: ${state.catalog.items.length}`
        ],
        body: renderCatalogOverviewState(state)
    });
}

function renderExerciseMainPanel(state) {
    const detail = state.detail.data;

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return renderLessonLane({
            lane: "lesson",
            label: "Focused lesson",
            title: "Loading the center lesson surface",
            description: "The route is already stable. The center lane is holding a reading-first lesson frame while the active detail provider resolves the selected scenario by slug.",
            meta: [
                `Route: ${state.route}`,
                `Detail: ${state.detail.status}`
            ],
            body: `
                <section class="lesson-spotlight lesson-spotlight--loading">
                    <span class="control-label">Lesson state</span>
                    <h4 class="lesson-block__title">Waiting for task description</h4>
                    <p class="panel-copy">The lesson rail can load before the final task copy, ordered steps, and annotations are ready to read.</p>
                </section>
            `
        });
    }

    if (state.detail.status === "error") {
        return renderLessonLane({
            lane: "lesson",
            label: "Focused lesson",
            title: "Exercise detail is unavailable",
            description: "The exercise route now has explicit load and error flow handling. The shell stays in place, but the center lesson surface cannot render without the selected scenario payload.",
            meta: [
                `Provider: ${state.providerName}`,
                "Detail: error"
            ],
            body: `
                <section class="lesson-block">
                    <h4 class="lesson-block__title">Requested route</h4>
                    <dl class="result-summary">
                        <div>
                            <dt>Scenario slug</dt>
                            <dd>${escapeHtml(state.selectedScenarioSlug ?? "unknown")}</dd>
                        </div>
                        <div>
                            <dt>Provider</dt>
                            <dd>${escapeHtml(state.providerName)}</dd>
                        </div>
                        <div>
                            <dt>Error</dt>
                            <dd>${escapeHtml(state.detail.error ?? "Unknown scenario detail error")}</dd>
                        </div>
                    </dl>
                </section>
            `
        });
    }

    return renderLessonLane({
        lane: "lesson",
        label: detail.workspace.shell.centerPanelTitle,
        title: detail.title,
        description: detail.workspace.task.goal,
        meta: [
            `Task: ${detail.workspace.task.status}`,
            `Difficulty: ${detail.difficulty}`,
            `Steps: ${normalizeTaskSteps(detail).length}`
        ],
        body: `
            <section class="lesson-spotlight">
                <span class="control-label">Focused lesson</span>
                <h4 class="lesson-block__title">Task goal</h4>
                <p class="panel-copy">${escapeHtml(detail.workspace.task.goal)}</p>
                <div class="lesson-spotlight__meta">
                    <span class="lesson-spotlight__pill">Instructions: ${normalizeTaskInstructions(detail).length}</span>
                    <span class="lesson-spotlight__pill">Steps: ${normalizeTaskSteps(detail).length}</span>
                    <span class="lesson-spotlight__pill">Annotations: ${normalizeTaskAnnotations(detail).length}</span>
                </div>
            </section>
            <section class="lesson-block lesson-block--reading">
                <div class="lesson-section__header">
                    <span class="control-label">Read first</span>
                    <h4 class="lesson-block__title">Instruction flow</h4>
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
                    <span class="control-label">Follow next</span>
                    <h4 class="lesson-block__title">Ordered steps</h4>
                </div>
                <ol class="task-steps">
                    ${normalizeTaskSteps(detail).map((step) => `
                        <li class="task-steps__item">
                            <div class="task-steps__header">
                                <span class="task-step__position">Step ${step.position}</span>
                                <strong>${escapeHtml(step.title)}</strong>
                            </div>
                            <p>${escapeHtml(step.detail)}</p>
                        </li>
                    `).join("")}
                </ol>
            </section>
            <section class="lesson-block lesson-block--reading">
                <div class="lesson-section__header">
                    <span class="control-label">Keep in mind</span>
                    <h4 class="lesson-block__title">Static workspace annotations</h4>
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
    });
}

function describeCatalogStatus(state) {
    switch (state.catalog.status) {
        case "loading":
            return {
                description: "The shared shell is waiting for the active provider to resolve the latest catalog query."
            };
        case "empty":
            return {
                description: "The shell stays intact, but the current filters leave no scenario to route into the workspace."
            };
        case "error":
            return {
                description: state.catalog.error ?? "The active provider failed before returning scenario summaries."
            };
        case "ready":
            return {
                description: "Catalog results are ready and any listed scenario can reserve the exercise route inside this same shell."
            };
        default:
            return {
                description: "Pick a provider, tune the query, and choose which scenario should open the shared workspace route."
            };
    }
}

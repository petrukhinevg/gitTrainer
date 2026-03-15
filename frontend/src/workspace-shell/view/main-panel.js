import { renderCatalogOverviewState } from "./catalog-surfaces.js";
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

    return `
        <section class="panel panel--lesson">
            <p class="panel-label">Catalog overview</p>
            <h3>Choose a scenario before opening the workspace</h3>
            <p class="panel-copy">${escapeHtml(describeCatalogStatus(state).description)}</p>
            ${renderCatalogOverviewState(state)}
        </section>
    `;
}

function renderExerciseMainPanel(state) {
    const detail = state.detail.data;

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return `
            <section class="panel panel--lesson">
                <p class="panel-label">Focused lesson</p>
                <h3>Loading the center lesson surface</h3>
                <p class="panel-copy">
                    The route is already stable. The center lane is holding a reading-first lesson frame while the active detail provider resolves the selected scenario by slug.
                </p>
                <div class="lesson-spotlight lesson-spotlight--loading">
                    <span class="control-label">Lesson state</span>
                    <h4 class="lesson-block__title">Waiting for task description</h4>
                    <p class="panel-copy">The lesson rail can load before the final task copy, ordered steps, and annotations are ready to read.</p>
                </div>
            </section>
        `;
    }

    if (state.detail.status === "error") {
        return `
            <section class="panel panel--lesson">
                <p class="panel-label">Focused lesson</p>
                <h3>Exercise detail is unavailable</h3>
                <p class="panel-copy">
                    The exercise route now has explicit load and error flow handling. The shell stays in place, but the center lesson surface cannot render without the selected scenario payload.
                </p>
                <div class="lesson-block">
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
                </div>
            </section>
        `;
    }

    return `
        <section class="panel panel--lesson">
            <p class="panel-label">Focused lesson</p>
            <h3>${escapeHtml(detail.title)}</h3>
            <p class="panel-copy">${escapeHtml(detail.summary)}</p>
            <div class="lesson-spotlight">
                <span class="control-label">${escapeHtml(detail.workspace.shell.centerPanelTitle)}</span>
                <h4 class="lesson-block__title">Task goal</h4>
                <p class="panel-copy">${escapeHtml(detail.workspace.task.goal)}</p>
                <div class="lesson-spotlight__meta">
                    <span class="lesson-spotlight__pill">Task: ${escapeHtml(detail.workspace.task.status)}</span>
                    <span class="lesson-spotlight__pill">Instructions: ${normalizeTaskInstructions(detail).length}</span>
                    <span class="lesson-spotlight__pill">Steps: ${normalizeTaskSteps(detail).length}</span>
                    <span class="lesson-spotlight__pill">Annotations: ${normalizeTaskAnnotations(detail).length}</span>
                </div>
            </div>
            <div class="lesson-block lesson-block--reading">
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
            </div>
            <div class="lesson-block lesson-block--reading">
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
            </div>
            <div class="lesson-block lesson-block--reading">
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
            </div>
            <div class="lesson-block lesson-block--supporting">
                <div class="lesson-section__header">
                    <span class="control-label">Supporting seam</span>
                    <h4 class="lesson-block__title">Provider seam</h4>
                </div>
                <p class="panel-copy">
                    The focused lesson surface still reads directly from the existing workspace payload without requiring new backend progression contracts.
                </p>
                <dl class="result-summary">
                    <div>
                        <dt>Detail source</dt>
                        <dd>${escapeHtml(detail.meta.source)}</dd>
                    </div>
                    <div>
                        <dt>Stub payload</dt>
                        <dd>${escapeHtml(String(detail.meta.stub))}</dd>
                    </div>
                    <div>
                        <dt>Difficulty</dt>
                        <dd>${escapeHtml(detail.difficulty)}</dd>
                    </div>
                </dl>
            </div>
        </section>
    `;
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

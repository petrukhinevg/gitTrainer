import { renderCatalogOverviewState } from "./catalog-surfaces.js";
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
                <p class="panel-label">Workspace lesson</p>
                <h3>Loading workspace detail</h3>
                <p class="panel-copy">
                    The route is already stable. This shell is waiting for the active detail provider to resolve the selected scenario by slug.
                </p>
            </section>
        `;
    }

    if (state.detail.status === "error") {
        return `
            <section class="panel panel--lesson">
                <p class="panel-label">Workspace lesson</p>
                <h3>Exercise detail is unavailable</h3>
                <p class="panel-copy">
                    The exercise route now has explicit load and error flow handling. The shell stays in place, but the selected scenario detail provider failed before returning a payload.
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
            <p class="panel-label">${escapeHtml(detail.workspace.shell.centerPanelTitle)}</p>
            <h3>${escapeHtml(detail.title)}</h3>
            <p class="panel-copy">${escapeHtml(detail.summary)}</p>
            <div class="lesson-block">
                <h4 class="lesson-block__title">Task goal</h4>
                <p class="panel-copy">${escapeHtml(detail.workspace.task.goal)}</p>
                <dl class="result-summary">
                    <div>
                        <dt>Task status</dt>
                        <dd>${escapeHtml(detail.workspace.task.status)}</dd>
                    </div>
                    <div>
                        <dt>Instructions</dt>
                        <dd>${detail.workspace.task.instructions.length}</dd>
                    </div>
                    <div>
                        <dt>Steps</dt>
                        <dd>${detail.workspace.task.steps.length}</dd>
                    </div>
                    <div>
                        <dt>Annotations</dt>
                        <dd>${resolveTaskAnnotations(detail).length}</dd>
                    </div>
                </dl>
            </div>
            <div class="lesson-block">
                <h4 class="lesson-block__title">Instruction flow</h4>
                <ol class="task-sequence">
                    ${resolveTaskInstructions(detail).map((instruction, index) => `
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
            <div class="lesson-block">
                <h4 class="lesson-block__title">Ordered steps</h4>
                <ol class="task-steps">
                    ${resolveTaskSteps(detail).map((step) => `
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
            <div class="lesson-block">
                <h4 class="lesson-block__title">Static workspace annotations</h4>
                <div class="task-annotations">
                    ${resolveTaskAnnotations(detail).map((annotation) => `
                        <article class="task-annotation">
                            <span class="control-label">${escapeHtml(annotation.label)}</span>
                            <p>${escapeHtml(annotation.message)}</p>
                        </article>
                    `).join("")}
                </div>
            </div>
            <div class="lesson-block">
                <h4 class="lesson-block__title">Provider seam</h4>
                <p class="panel-copy">
                    Task presentation and repository-context surfaces now use the workspace payload directly without reshaping the exercise shell.
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

function resolveTaskInstructions(detail) {
    return (detail.workspace.task.instructions ?? []).map((instruction, index) => {
        if (typeof instruction === "string") {
            return {
                id: `instruction-${index + 1}`,
                text: instruction
            };
        }

        return {
            id: instruction.id ?? `instruction-${index + 1}`,
            text: instruction.text ?? ""
        };
    });
}

function resolveTaskSteps(detail) {
    return (detail.workspace.task.steps ?? [])
        .map((step, index) => {
            if (typeof step === "string") {
                return {
                    position: index + 1,
                    title: `Step ${index + 1}`,
                    detail: step
                };
            }

            return {
                position: step.position ?? index + 1,
                title: step.title ?? `Step ${index + 1}`,
                detail: step.detail ?? ""
            };
        })
        .sort((left, right) => left.position - right.position);
}

function resolveTaskAnnotations(detail) {
    return (detail.workspace.task.annotations ?? []).map((annotation, index) => {
        if (typeof annotation === "string") {
            return {
                label: `Note ${index + 1}`,
                message: annotation
            };
        }

        return {
            label: annotation.label ?? `Note ${index + 1}`,
            message: annotation.message ?? ""
        };
    });
}

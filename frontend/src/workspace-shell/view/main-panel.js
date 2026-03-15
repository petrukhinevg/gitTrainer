import { renderCatalogOverviewState } from "./catalog-surfaces.js";
import { renderLessonLane } from "./lesson-layout.js";
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
            label: "Lesson lane",
            title: "Loading workspace detail in the center lesson column",
            description: "The route is already stable. This lane waits for the active detail provider to resolve the selected scenario by slug.",
            meta: [
                `Route: ${state.route}`,
                `Detail: ${state.detail.status}`
            ],
            body: `
                <section class="lesson-block lesson-block--highlight">
                    <h4 class="lesson-block__title">Lesson payload</h4>
                    <p class="panel-copy">
                        The learner already has the final shell shape. Only the scenario-specific lesson content is pending.
                    </p>
                </section>
            `
        });
    }

    if (state.detail.status === "error") {
        return renderLessonLane({
            lane: "lesson",
            label: "Lesson lane",
            title: "Exercise detail is unavailable",
            description: "The exercise route keeps its center lesson frame even when the selected scenario detail provider fails before returning a payload.",
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
        description: detail.summary,
        meta: [
            `Task: ${detail.workspace.task.status}`,
            `Difficulty: ${detail.difficulty}`,
            `Source: ${detail.meta.source}`
        ],
        body: `
            <section class="lesson-block lesson-block--highlight">
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
            </section>
            <section class="lesson-block">
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
            </section>
            <section class="lesson-block">
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
            </section>
            <section class="lesson-block">
                <h4 class="lesson-block__title">Static workspace annotations</h4>
                <div class="task-annotations">
                    ${resolveTaskAnnotations(detail).map((annotation) => `
                        <article class="task-annotation">
                            <span class="control-label">${escapeHtml(annotation.label)}</span>
                            <p>${escapeHtml(annotation.message)}</p>
                        </article>
                    `).join("")}
                </div>
            </section>
            <section class="lesson-block">
                <h4 class="lesson-block__title">Provider seam</h4>
                <p class="panel-copy">
                    Task presentation and repository-context surfaces still consume the existing workspace payload directly, even though the overall screen has been promoted into stable lesson lanes.
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

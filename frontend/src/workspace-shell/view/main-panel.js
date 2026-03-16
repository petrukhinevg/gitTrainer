import { renderLessonLane } from "./lesson-layout.js";
import {
    normalizeTaskAnnotations,
    normalizeTaskInstructions,
    normalizeTaskSteps
} from "./lesson-task.js";
import { escapeHtml } from "./render-helpers.js";

export function renderMainPanel(state, { tagOptions = [], providerOptions = [] } = {}) {
    if (state.route === "exercise") {
        return renderExerciseMainPanel(state);
    }

    return renderLessonLane({
        lane: "lesson",
        showHeader: false,
        body: `
            ${renderMainLead({
                label: "Welcome page",
                title: "Choose a task block from the left lane",
                description: "The catalog page is gone. The left column now owns the full task flow, and the center lane shows the selected page.",
                meta: [
                    `Scenarios: ${state.catalog.items.length}`,
                    `Catalog: ${state.catalog.status}`
                ]
            })}
            ${renderWelcomePage(state, { tagOptions, providerOptions })}
        `
    });
}

function renderExerciseMainPanel(state) {
    const detail = state.detail.data;

    if (state.detail.status === "loading" || state.detail.status === "idle") {
        return renderLessonLane({
            lane: "lesson",
            showHeader: false,
            body: `
                ${renderMainLead({
                    label: "Focused lesson",
                    title: "Loading the center lesson surface",
                    description: "The center lane is resolving the page selected from the left navigation flow.",
                    meta: [
                        `Route: ${state.route}`,
                        `Detail: ${state.detail.status}`
                    ]
                })}
                <section class="lesson-spotlight lesson-spotlight--loading">
                    <span class="control-label">Lesson state</span>
                    <h4 class="lesson-block__title">Waiting for task description</h4>
                    <p class="panel-copy">The page shell is mounted. The selected task page is still loading.</p>
                </section>
            `
        });
    }

    if (state.detail.status === "error") {
        return renderLessonLane({
            lane: "lesson",
            showHeader: false,
            body: `
                ${renderMainLead({
                    label: "Focused lesson",
                    title: "Exercise detail is unavailable",
                    description: "The selected task page could not be loaded for this route.",
                    meta: [
                        `Provider: ${state.providerName}`,
                        "Detail: error"
                    ]
                })}
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

    const focusedContent = resolveFocusedLessonContent(detail, state.selectedFocus);

    return renderLessonLane({
        lane: "lesson",
        showHeader: false,
        body: `
            ${renderMainLead({
                label: detail.workspace.shell.centerPanelTitle,
                title: focusedContent.title,
                description: focusedContent.description,
                meta: [
                    `Task: ${detail.workspace.task.status}`,
                    `Difficulty: ${detail.difficulty}`,
                    `Page: ${focusedContent.metaLabel}`
                ]
            })}
            ${focusedContent.body}
        `
    });
}

function renderWelcomePage(state, { tagOptions, providerOptions }) {
    return `
        <section class="lesson-spotlight">
            <span class="control-label">Greeting</span>
            <h4 class="lesson-block__title">Practice Git inside one workspace shell</h4>
            <p class="panel-copy">The left lane now owns navigation. Pick a task block there to open its page here without leaving the SPA shell.</p>
            <div class="lesson-spotlight__meta">
                <span class="lesson-spotlight__pill">Tasks: ${state.catalog.items.length}</span>
                <span class="lesson-spotlight__pill">Route: ${state.route}</span>
            </div>
        </section>
        ${renderCatalogControlPanel(state, { tagOptions, providerOptions })}
        <section class="lesson-block lesson-block--reading">
            <div class="lesson-section__header">
                <span class="control-label">Loop</span>
                <h4 class="lesson-block__title">How to use this screen</h4>
            </div>
            <ol class="task-sequence">
                <li class="task-sequence__item">
                    <span class="task-sequence__index">1</span>
                    <div class="task-sequence__copy">
                        <strong>Choose a task on the left</strong>
                        <p>The left column is now the task catalog and sub-task navigator at the same time.</p>
                    </div>
                </li>
                <li class="task-sequence__item">
                    <span class="task-sequence__index">2</span>
                    <div class="task-sequence__copy">
                        <strong>Read the selected page in the center</strong>
                        <p>Task overview and focused sub-task content open here instead of on a separate catalog page.</p>
                    </div>
                </li>
                <li class="task-sequence__item">
                    <span class="task-sequence__index">3</span>
                    <div class="task-sequence__copy">
                        <strong>Keep practicing on the right</strong>
                        <p>The right lane remains visible for Git context inspection and answer drafting.</p>
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
                <span class="control-label">Catalog controls</span>
                <h4 class="lesson-block__title">Filter and source the current scenario slice</h4>
            </div>
            <form class="catalog-controls__form" data-catalog-controls-form>
                <div class="catalog-controls__grid">
                    <label class="catalog-controls__field">
                        <span class="control-label">Source</span>
                        <select name="providerName">
                            ${providerOptions.map((providerName) => `
                                <option value="${escapeHtml(providerName)}"${providerName === state.providerName ? " selected" : ""}>${escapeHtml(providerName)}</option>
                            `).join("")}
                        </select>
                    </label>
                    <label class="catalog-controls__field">
                        <span class="control-label">Difficulty</span>
                        <select name="difficulty">
                            <option value="">All difficulties</option>
                            <option value="beginner"${state.query.difficulty === "beginner" ? " selected" : ""}>Beginner</option>
                            <option value="intermediate"${state.query.difficulty === "intermediate" ? " selected" : ""}>Intermediate</option>
                        </select>
                    </label>
                    <label class="catalog-controls__field">
                        <span class="control-label">Sort</span>
                        <select name="sort">
                            <option value="">Title</option>
                            <option value="difficulty"${state.query.sort === "difficulty" ? " selected" : ""}>Difficulty</option>
                        </select>
                    </label>
                </div>
                <fieldset class="catalog-controls__tags">
                    <legend class="control-label">Tags</legend>
                    <div class="catalog-controls__tag-list">
                        ${tagOptions.map((tag) => `
                            <label class="catalog-controls__tag-option">
                                <input
                                    type="checkbox"
                                    name="tags"
                                    value="${escapeHtml(tag)}"${state.query.tags.includes(tag) ? " checked" : ""}
                                >
                                <span>${escapeHtml(tag)}</span>
                            </label>
                        `).join("")}
                    </div>
                </fieldset>
                <div class="catalog-controls__actions">
                    <button class="scenario-action scenario-action--muted" type="button" data-reset-catalog-controls>Reset controls</button>
                    <span class="catalog-controls__summary">
                        ${escapeHtml(describeCatalogQuery(state))}
                    </span>
                </div>
            </form>
        </section>
    `;
}

function describeCatalogQuery(state) {
    const activeParts = [];
    if (state.query.difficulty) {
        activeParts.push(`difficulty: ${state.query.difficulty}`);
    }
    if (state.query.sort) {
        activeParts.push(`sort: ${state.query.sort}`);
    }
    if (state.query.tags.length) {
        activeParts.push(`tags: ${state.query.tags.join(", ")}`);
    }

    const queryLabel = activeParts.length ? activeParts.join(" | ") : "no active filters";
    return `Source ${state.providerName} | ${queryLabel}`;
}

function resolveFocusedLessonContent(detail, selectedFocus) {
    const normalizedFocus = selectedFocus === "overview" ? null : selectedFocus;
    const selectedStep = normalizeTaskSteps(detail).find((step) => `step-${step.position}` === normalizedFocus);
    if (selectedStep) {
        return {
            title: selectedStep.title,
            description: selectedStep.detail,
            metaLabel: `sub-task ${selectedStep.position}`,
            body: `
                <section class="lesson-spotlight">
                    <span class="control-label">Sub-task ${selectedStep.position}</span>
                    <h4 class="lesson-block__title">${escapeHtml(selectedStep.title)}</h4>
                    <p class="panel-copy">${escapeHtml(selectedStep.detail)}</p>
                </section>
                <section class="lesson-block lesson-block--reading">
                    <div class="lesson-section__header">
                        <span class="control-label">Why this step matters</span>
                        <h4 class="lesson-block__title">Step context</h4>
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
        metaLabel: "overview",
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

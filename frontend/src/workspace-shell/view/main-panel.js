import { renderLessonLane } from "./lesson-layout.js";
import {
    normalizeTaskAnnotations,
    normalizeTaskInstructions,
    normalizeTaskSteps
} from "./lesson-task.js";
import { encodeHashSegment, escapeHtml } from "./render-helpers.js";

export function renderMainPanel(state, { tagOptions = [], providerOptions = [] } = {}) {
    if (state.route === "exercise") {
        return renderExerciseMainPanel(state);
    }

    if (state.route === "progress") {
        return renderProgressMainPanel(state);
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

function renderProgressMainPanel(state) {
    if (state.progress.status === "loading" || state.progress.status === "idle") {
        return renderLessonLane({
            lane: "lesson",
            showHeader: false,
            body: `
                ${renderMainLead({
                    label: "Progress route",
                    title: "Loading progress surface",
                    description: "The shell is mounted and waiting for progress summary data.",
                    meta: [
                        `Route: ${state.route}`,
                        `Status: ${state.progress.status}`
                    ]
                })}
                <section class="lesson-spotlight lesson-spotlight--loading" data-progress-surface>
                    <span class="control-label">Progress state</span>
                    <h4 class="lesson-block__title">Preparing progress markers</h4>
                    <p class="panel-copy">Status markers and recent activity will mount here once the summary is ready.</p>
                </section>
            `
        });
    }

    if (state.progress.status === "error") {
        return renderLessonLane({
            lane: "lesson",
            showHeader: false,
            body: `
                ${renderMainLead({
                    label: "Progress route",
                    title: "Progress surface is unavailable",
                    description: "The shell stays mounted even when progress data cannot be loaded.",
                    meta: [
                        `Route: ${state.route}`,
                        `Status: ${state.progress.status}`
                    ]
                })}
                <section class="lesson-block lesson-block--reading" data-progress-surface>
                    <div class="lesson-section__header">
                        <span class="control-label">Recovery</span>
                        <h4 class="lesson-block__title">Progress summary unavailable</h4>
                    </div>
                    <p class="panel-copy">${escapeHtml(state.progress.error ?? "Progress summary is unavailable right now.")}</p>
                </section>
            `
        });
    }

    if (state.progress.status === "empty") {
        return renderLessonLane({
            lane: "lesson",
            showHeader: false,
            body: `
                ${renderMainLead({
                    label: "Progress route",
                    title: "No recorded progress yet",
                    description: "The shell is ready, but no scenario activity has been recorded.",
                    meta: [
                        `Route: ${state.route}`,
                        `Status: ${state.progress.status}`
                    ]
                })}
                <section class="lesson-spotlight" data-progress-surface>
                    <span class="control-label">Empty state</span>
                    <h4 class="lesson-block__title">Start a scenario to populate this surface</h4>
                    <p class="panel-copy">Once the learner starts or completes scenarios, status markers and recent activity will appear here.</p>
                </section>
            `
        });
    }

    const summary = state.progress.summary;
    const totalScenarios = summary?.items?.length ?? 0;
    const completedCount = summary?.items?.filter((item) => item.status === "completed").length ?? 0;
    const inProgressCount = summary?.items?.filter((item) => item.status === "in_progress").length ?? 0;
    return renderLessonLane({
        lane: "lesson",
        showHeader: false,
        body: `
            ${renderMainLead({
                label: "Progress route",
                title: "Track learner progress without leaving the shell",
                description: "The progress route now shows stable status markers and recent activity surfaces on top of local summary props.",
                meta: [
                    `Route: ${state.route}`,
                    `Status: ${state.progress.status}`,
                    `Source: ${summary?.meta?.source ?? "unknown"}`
                ]
            })}
            <section class="lesson-spotlight" data-progress-surface>
                <span class="control-label">Progress overview</span>
                <h4 class="lesson-block__title">Status markers are visible before live integration</h4>
                <p class="panel-copy">This shell keeps completion, in-progress, and untouched scenarios readable in one place so later provider integration can focus on transport states instead of reworking the layout.</p>
                <div class="lesson-spotlight__meta">
                    <span class="lesson-spotlight__pill">Scenarios: ${totalScenarios}</span>
                    <span class="lesson-spotlight__pill">Completed: ${completedCount}</span>
                    <span class="lesson-spotlight__pill">In progress: ${inProgressCount}</span>
                </div>
            </section>
            <section class="lesson-block lesson-block--reading">
                <div class="lesson-section__header">
                    <span class="control-label">Scenario markers</span>
                    <h4 class="lesson-block__title">Current progress at a glance</h4>
                </div>
                <div class="progress-summary-grid">
                    ${summary.items.map((item) => renderProgressItemCard(item)).join("")}
                </div>
            </section>
            <section class="lesson-block lesson-block--reading">
                <div class="lesson-section__header">
                    <span class="control-label">Recent activity</span>
                    <h4 class="lesson-block__title">Latest learner movement</h4>
                </div>
                <div class="progress-activity-list" data-progress-activity-list>
                    ${summary.recentActivity.map((activity) => renderRecentProgressActivity(activity)).join("")}
                </div>
            </section>
            <section class="lesson-block lesson-block--reading">
                <div class="lesson-section__header">
                    <span class="control-label">Next-step guidance</span>
                    <h4 class="lesson-block__title">Recommendation surface is now mounted</h4>
                </div>
                ${renderProgressGuidanceShell(summary.recommendations)}
            </section>
        `
    });
}

function renderProgressItemCard(item) {
    return `
        <article class="progress-card" data-progress-status-marker="${escapeHtml(item.status)}">
            <div class="progress-card__header">
                <span class="progress-status-marker progress-status-marker--${escapeHtml(item.status)}">${escapeHtml(formatProgressStatus(item.status))}</span>
                <span class="lesson-spotlight__pill">${escapeHtml(describeProgressCounts(item))}</span>
            </div>
            <strong>${escapeHtml(item.scenarioTitle)}</strong>
            <p class="panel-copy">${escapeHtml(describeProgressActivity(item))}</p>
        </article>
    `;
}

function renderRecentProgressActivity(activity) {
    return `
        <article class="progress-activity" data-progress-activity="${escapeHtml(activity.eventType)}">
            <div class="progress-activity__header">
                <span class="progress-status-marker progress-status-marker--${escapeHtml(activity.status)}">${escapeHtml(formatProgressStatus(activity.status))}</span>
                <span class="lesson-spotlight__pill">${escapeHtml(formatActivityType(activity.eventType))}</span>
            </div>
            <strong>${escapeHtml(activity.scenarioTitle)}</strong>
            <p class="panel-copy">${escapeHtml(describeRecentActivity(activity))}</p>
        </article>
    `;
}

function formatProgressStatus(status) {
    return String(status ?? "unknown").replaceAll("_", " ");
}

function describeProgressCounts(item) {
    return `${item.attemptCount} attempt${item.attemptCount === 1 ? "" : "s"} | ${item.completionCount} complete`;
}

function describeProgressActivity(item) {
    if (item.lastActivityAt) {
        return `Latest activity was recorded at ${item.lastActivityAt}.`;
    }

    return "This scenario has not been touched yet.";
}

function formatActivityType(eventType) {
    return eventType === "completed"
        ? "completion"
        : eventType === "attempted"
            ? "attempt"
            : "start";
}

function describeRecentActivity(activity) {
    return `${activity.scenarioTitle} last reported a ${formatActivityType(activity.eventType)} event at ${activity.happenedAt}.`;
}

function renderProgressGuidanceShell(recommendations) {
    const solvedItems = recommendations?.solved ?? [];
    const attemptedItems = recommendations?.attempted ?? [];
    const solvedCount = recommendations?.solved?.length ?? 0;
    const attemptedCount = recommendations?.attempted?.length ?? 0;
    const nextScenario = recommendations?.next ?? null;
    const hasNextAttempt = nextScenario && attemptedItems.some(
        (scenario) => scenario.scenarioSlug === nextScenario.scenarioSlug
    );
    const primaryMarker = hasNextAttempt ? "in_progress" : "planned";
    const primaryLabel = hasNextAttempt ? "Resume next scenario" : "Start recommended scenario";
    const primaryHref = nextScenario
        ? `#/exercise/${encodeHashSegment(nextScenario.scenarioSlug)}`
        : "#/progress";
    const secondaryAttempt = attemptedItems.find(
        (scenario) => scenario.scenarioSlug !== nextScenario?.scenarioSlug
    ) ?? null;

    return `
        <div class="progress-guidance-shell" data-progress-guidance-shell>
            <div class="progress-guidance-shell__hero" data-progress-guidance-primary>
                <span class="progress-status-marker progress-status-marker--${escapeHtml(primaryMarker)}">guided</span>
                <strong>${escapeHtml(nextScenario?.scenarioTitle ?? "Recommendation is still resolving")}</strong>
                <p class="panel-copy">${escapeHtml(recommendations?.rationale ?? "Recommendation guidance is unavailable.")}</p>
                <div class="lesson-spotlight__meta">
                    <span class="lesson-spotlight__pill">Primary: ${escapeHtml(primaryLabel)}</span>
                    <span class="lesson-spotlight__pill">Solved: ${solvedCount}</span>
                    <span class="lesson-spotlight__pill">Attempted: ${attemptedCount}</span>
                </div>
                <div class="progress-guidance-actions">
                    <a class="scenario-action" href="${escapeHtml(primaryHref)}">${escapeHtml(primaryLabel)}</a>
                    ${secondaryAttempt ? `
                        <a class="scenario-action scenario-action--secondary" href="#/exercise/${encodeHashSegment(secondaryAttempt.scenarioSlug)}">Continue attempted scenario</a>
                    ` : ""}
                </div>
            </div>
            <div class="progress-guidance-groups">
                ${renderProgressRecommendationList({
                    label: "Attempted and still active",
                    title: "Keep momentum on work already in progress",
                    items: attemptedItems,
                    emptyCopy: "No partially completed scenarios need follow-up right now.",
                    marker: "in_progress",
                    actionLabel: "Continue"
                })}
                ${renderProgressRecommendationList({
                    label: "Solved and available",
                    title: "Revisit solved scenarios when you need reinforcement",
                    items: solvedItems,
                    emptyCopy: "No solved scenarios are available for review yet.",
                    marker: "completed",
                    actionLabel: "Review"
                })}
            </div>
            <div class="lesson-spotlight__meta">
                <span class="lesson-spotlight__pill">Solved: ${solvedCount}</span>
                <span class="lesson-spotlight__pill">Attempted: ${attemptedCount}</span>
                <span class="lesson-spotlight__pill">Next: ${nextScenario ? "ready" : "pending"}</span>
            </div>
        </div>
    `;
}

function renderProgressRecommendationList({
    label,
    title,
    items,
    emptyCopy,
    marker,
    actionLabel
}) {
    return `
        <section class="progress-guidance-group" data-progress-recommendation-list="${escapeHtml(label)}">
            <div class="lesson-section__header">
                <span class="control-label">${escapeHtml(label)}</span>
                <h5 class="lesson-block__title">${escapeHtml(title)}</h5>
            </div>
            ${items.length > 0 ? `
                <div class="progress-guidance-list">
                    ${items.map((item) => renderProgressRecommendationCard(item, { marker, actionLabel })).join("")}
                </div>
            ` : `
                <p class="panel-copy">${escapeHtml(emptyCopy)}</p>
            `}
        </section>
    `;
}

function renderProgressRecommendationCard(item, { marker, actionLabel }) {
    return `
        <article class="progress-recommendation-card">
            <div class="progress-card__header">
                <span class="progress-status-marker progress-status-marker--${escapeHtml(marker)}">${escapeHtml(formatProgressStatus(marker))}</span>
                <span class="lesson-spotlight__pill">${escapeHtml(item.scenarioSlug)}</span>
            </div>
            <strong>${escapeHtml(item.scenarioTitle)}</strong>
            <div class="progress-guidance-actions">
                <a class="scenario-action scenario-action--secondary" href="#/exercise/${encodeHashSegment(item.scenarioSlug)}">${escapeHtml(actionLabel)}</a>
            </div>
        </article>
    `;
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

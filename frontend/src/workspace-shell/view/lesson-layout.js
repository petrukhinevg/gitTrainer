import {
    escapeHtml,
} from "./render-helpers.js";

export function renderLessonLayout({ state, navigationLane, lessonLane, practiceLane }) {
    return `
        <section class="lesson-layout lesson-layout--${escapeHtml(state.route)}" aria-label="Рабочее пространство урока">
            <div class="lesson-layout__lane lesson-layout__lane--navigation">
                ${navigationLane}
            </div>
            <div class="lesson-layout__lane lesson-layout__lane--lesson">
                ${lessonLane}
            </div>
            <div class="lesson-layout__lane lesson-layout__lane--practice">
                ${practiceLane}
            </div>
        </section>
    `;
}

export function renderLessonLane({ lane, label, title, description, meta = [], body, showHeader = true }) {
    return `
        <section class="lesson-lane lesson-lane--${escapeHtml(lane)} panel">
            ${showHeader ? `
                <header class="lesson-lane__header">
                    <div class="lesson-lane__heading">
                        <p class="panel-label">${escapeHtml(label)}</p>
                        <h3>${escapeHtml(title)}</h3>
                        <p class="panel-copy">${escapeHtml(description)}</p>
                    </div>
                    ${renderLaneMeta(meta)}
                </header>
            ` : ""}
            <div class="lesson-lane__body">
                <div class="lesson-lane__scroll-content">
                    ${body}
                </div>
            </div>
        </section>
    `;
}

function renderLaneMeta(meta) {
    if (!Array.isArray(meta) || meta.length === 0) {
        return "";
    }

    return `
        <div class="lesson-lane__meta">
            ${meta.map((item) => `
                <span class="lesson-lane__meta-chip">${escapeHtml(item)}</span>
            `).join("")}
        </div>
    `;
}

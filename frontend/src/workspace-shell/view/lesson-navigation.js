import {
    escapeHtml,
    formatDifficulty
} from "./render-helpers.js";
import { buildLessonNavigationItems } from "./lesson-task.js";

export function renderLessonNavigationRail(detail) {
    const items = buildLessonNavigationItems(detail);
    return `
        <section class="lesson-rail">
            <div class="lesson-rail__summary">
                <span class="control-label">Active lesson</span>
                <strong>${escapeHtml(detail.title)}</strong>
                <p class="panel-copy">${escapeHtml(detail.summary)}</p>
                <div class="lesson-rail__meta">
                    <span class="lesson-rail__meta-pill">${escapeHtml(formatDifficulty(detail.difficulty))}</span>
                    <span class="lesson-rail__meta-pill">${detail.tags.length} tag${detail.tags.length === 1 ? "" : "s"}</span>
                    <span class="lesson-rail__meta-pill">${escapeHtml(detail.meta.source)}</span>
                </div>
            </div>

            <div class="lesson-rail__map">
                <div class="lesson-rail__header">
                    <span class="control-label">Lesson map</span>
                    <strong>${items.length}</strong>
                </div>
                <ol class="lesson-nav">
                    ${items.map((item, index) => `
                        <li class="lesson-nav__item lesson-nav__item--${escapeHtml(item.state)}">
                            <div class="lesson-nav__marker">${index + 1}</div>
                            <div class="lesson-nav__copy">
                                <div class="lesson-nav__header">
                                    <span class="control-label">${escapeHtml(item.eyebrow)}</span>
                                    <span class="lesson-nav__state">${escapeHtml(item.state)}</span>
                                </div>
                                <strong>${escapeHtml(item.title)}</strong>
                                <p>${escapeHtml(item.detail)}</p>
                            </div>
                        </li>
                    `).join("")}
                </ol>
            </div>

            <div class="lesson-rail__footer">
                <a class="scenario-action scenario-action--muted" href="#/catalog">Back to catalog</a>
            </div>
        </section>
    `;
}

import {
    encodeHashSegment,
    escapeHtml,
    formatDifficulty,
    formatTag
} from "./render-helpers.js";

export function renderCatalogOverviewState(state) {
    switch (state.catalog.status) {
        case "loading":
            return `
                <div class="scenario-list skeleton-list" aria-hidden="true">
                    ${Array.from({length: 3}, () => `
                        <article class="scenario-card skeleton-card">
                            <div class="skeleton-line skeleton-line-short"></div>
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line"></div>
                            <div class="skeleton-tag-row">
                                <span class="skeleton-pill"></span>
                                <span class="skeleton-pill"></span>
                            </div>
                        </article>
                    `).join("")}
                </div>
            `;
        case "error":
            return `
                <section class="catalog-state catalog-state-error">
                    <strong>Источник недоступен</strong>
                    <p>${escapeHtml(state.catalog.error ?? "Выбранный источник каталога не вернул данные.")}</p>
                </section>
            `;
        case "empty":
            return `
                <section class="catalog-state catalog-state-empty">
                    <strong>В этом срезе нет сценариев</strong>
                    <p>Ослабьте фильтры, чтобы снова заполнить карту сценариев.</p>
                </section>
            `;
        default:
            return `
                <div class="scenario-preview">
                    <p class="control-label">Текущий предварительный просмотр</p>
                    <h4>Сценарий ещё не выбран</h4>
                    <p class="panel-copy">Выберите сценарий в карте или списке карточек, чтобы осознанно перейти в рабочее пространство.</p>
                </div>
                <div class="scenario-list">
                    ${state.catalog.items.map(renderScenarioCard).join("")}
                </div>
            `;
    }
}

export function renderScenarioRail(state, selectedCatalogScenario) {
    switch (state.catalog.status) {
        case "loading":
            return `<p class="panel-copy">Загружаем ссылки на сценарии для общей оболочки рабочего пространства.</p>`;
        case "error":
            return `<p class="panel-copy">${escapeHtml(state.catalog.error ?? "Источник каталога недоступен.")}</p>`;
        case "empty":
            return `<p class="panel-copy">Нет сценариев, подходящих под текущий запрос.</p>`;
        default:
            return `
                <div class="scenario-rail__list">
                    ${state.catalog.items.map((item) => renderScenarioRailLink(item, selectedCatalogScenario)).join("")}
                </div>
            `;
    }
}

function renderScenarioRailLink(item, selectedCatalogScenario) {
    const isActive = item.slug === selectedCatalogScenario?.slug;
    return `
        <a class="scenario-link ${isActive ? "scenario-link--active" : ""}" href="#/exercise/${encodeHashSegment(item.slug)}">
            <span>${escapeHtml(item.title)}</span>
            <span class="scenario-link__meta">${escapeHtml(formatDifficulty(item.difficulty))}</span>
        </a>
    `;
}

function renderScenarioCard(item) {
    return `
        <article class="scenario-card">
            <div class="scenario-card-header">
                <span class="difficulty-pill difficulty-${escapeHtml(item.difficulty)}">${escapeHtml(formatDifficulty(item.difficulty))}</span>
                <span class="scenario-slug">${escapeHtml(item.slug)}</span>
            </div>
            <h4>${escapeHtml(item.title)}</h4>
            <p class="panel-copy">${escapeHtml(item.summary)}</p>
            <div class="scenario-tags">
                ${item.tags.map((tag) => `<span class="scenario-tag">${escapeHtml(formatTag(tag))}</span>`).join("")}
            </div>
            <div class="scenario-card-footer">
                <a class="scenario-action" href="#/exercise/${encodeHashSegment(item.slug)}">Открыть сценарий</a>
                <span class="entry-note">Переход по маршруту теперь получает детали через отдельный provider seam.</span>
            </div>
        </article>
    `;
}

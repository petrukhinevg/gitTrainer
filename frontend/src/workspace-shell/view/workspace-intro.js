import {
    escapeHtml,
    formatProviderName
} from "./render-helpers.js";

export function renderRouteNotFound() {
    return `
        <section class="workspace-intro panel">
            <p class="panel-label">Оболочка маршрутов</p>
            <h2>Неизвестный маршрут</h2>
            <p>Фронтенд держит навигацию в одной оболочке, но сейчас подключены только <code>#/catalog</code>, <code>#/progress</code> и <code>#/exercise/&lt;slug&gt;</code>.</p>
        </section>
    `;
}

export function renderWorkspaceIntro(state) {
    return `
        <section class="workspace-intro panel">
            <div class="workspace-intro__copy">
                <p class="panel-label">Фронтенд</p>
                <h2>${escapeHtml(resolveIntroTitle(state))}</h2>
                <p>${escapeHtml(resolveIntroDescription(state))}</p>
            </div>
            <div class="workspace-intro__meta">
                <div class="workspace-chip">Маршрут: ${escapeHtml(formatRoute(state.route))}</div>
                <div class="workspace-chip">Источник: ${escapeHtml(formatProviderName(state.providerName))}</div>
                <div class="workspace-chip">Каталог: ${escapeHtml(formatStatus(state.catalog.status))}</div>
                <div class="workspace-chip">Детали: ${escapeHtml(resolveDetailStatusLabel(state))}</div>
            </div>
        </section>
    `;
}

function resolveIntroTitle(state) {
    if (state.route === "progress") {
        return "Маршрут прогресса держит стабильную оболочку";
    }

    if (state.route !== "exercise") {
        return "Каталог и переход в сценарий теперь живут в одной оболочке";
    }

    if (state.detail.status === "ready") {
        return state.detail.data.title;
    }

    if (state.detail.status === "error") {
        return "Маршрут упражнения сохраняет стабильную границу ошибки";
    }

    return "Маршрут упражнения загружает детали из выбранного источника";
}

function resolveIntroDescription(state) {
    if (state.route === "progress") {
        return "Экран прогресса вынесен в отдельный маршрут, чтобы сводка и рекомендации развивались на стабильной поверхности.";
    }

    if (state.route !== "exercise") {
        return "Каталог по-прежнему управляет выбором и источником данных, но теперь использует ту же трёхколоночную оболочку, что и упражнения.";
    }

    if (state.detail.status === "ready") {
        return "Пользователь уже вышел из каталога и попал в устойчивый макет с левой навигацией, центральным уроком и правой практикой.";
    }

    if (state.detail.status === "error") {
        return "Маршрут сохраняется, а вся трёхколоночная оболочка остаётся на месте даже при ошибке загрузки деталей.";
    }

    return "Маршрут упражнения теперь грузится через отдельный provider seam, а полный макет урока уже стоит на месте до дальнейшей детализации экрана.";
}

function resolveDetailStatusLabel(state) {
    return state.route === "exercise" ? formatStatus(state.detail.status) : "неактивно";
}

function formatRoute(value) {
    switch (value) {
        case "catalog":
            return "каталог";
        case "progress":
            return "прогресс";
        case "exercise":
            return "упражнение";
        default:
            return value ?? "неизвестно";
    }
}

function formatStatus(value) {
    switch (value) {
        case "idle":
            return "ожидание";
        case "loading":
            return "загрузка";
        case "ready":
            return "готово";
        case "error":
            return "ошибка";
        case "missing":
            return "не найдено";
        default:
            return value ?? "неизвестно";
    }
}

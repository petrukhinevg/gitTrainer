import {
    escapeHtml,
    formatProviderName
} from "./render-helpers.js";

export function renderRouteNotFound() {
    return `
        <section class="workspace-intro panel">
            <p class="panel-label">Навигация</p>
            <h2>Неизвестный маршрут</h2>
            <p>Сейчас доступны только <code>#/catalog</code>, <code>#/progress</code> и <code>#/exercise/&lt;код-сценария&gt;</code>.</p>
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
        return "Экран прогресса всегда остаётся на месте";
    }

    if (state.route !== "exercise") {
        return "Каталог и сценарий открываются на одном экране";
    }

    if (state.detail.status === "ready") {
        return state.detail.data.title;
    }

    if (state.detail.status === "error") {
        return "Экран упражнения сохранил состояние ошибки";
    }

    return "Упражнение загружает данные из выбранного источника";
}

function resolveIntroDescription(state) {
    if (state.route === "progress") {
        return "Здесь собраны сводка прогресса и рекомендации, чтобы отслеживать движение по сценариям в одном месте.";
    }

    if (state.route !== "exercise") {
        return "Каталог по-прежнему управляет выбором и источником данных, но использует тот же трёхколоночный экран, что и упражнения.";
    }

    if (state.detail.status === "ready") {
        return "Сценарий открыт: слева навигация, по центру описание задания, справа практика.";
    }

    if (state.detail.status === "error") {
        return "Даже если данные сценария не загрузились, структура экрана остаётся на месте.";
    }

    return "Экран упражнения уже открыт и ждёт данные выбранного сценария.";
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

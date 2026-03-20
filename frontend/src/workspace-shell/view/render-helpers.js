export function formatDifficulty(value) {
    switch (String(value ?? "").trim().toLowerCase()) {
        case "beginner":
            return "Начальный";
        case "intermediate":
            return "Средний";
        default:
            return value ? String(value) : "Неизвестно";
    }
}

export function formatProviderName(value) {
    switch (String(value ?? "").trim().toLowerCase()) {
        case "local-fixture":
            return "Локальные фикстуры";
        case "backend-api":
            return "Сервер";
        case "fixture-unavailable":
            return "Недоступный источник";
        default:
            return value ? String(value) : "Неизвестный источник";
    }
}

export function formatProviderOptionLabel(value) {
    switch (String(value ?? "").trim().toLowerCase()) {
        case "backend-api":
            return "Сервер (основной путь)";
        case "local-fixture":
            return "Локальные фикстуры (диагностика)";
        case "fixture-unavailable":
            return "Недоступный источник (fallback-проверка)";
        default:
            return formatProviderName(value);
    }
}

export function isDiagnosticProvider(value) {
    const normalizedValue = String(value ?? "").trim().toLowerCase();
    return normalizedValue === "local-fixture" || normalizedValue === "fixture-unavailable";
}

export function formatTag(value) {
    switch (String(value ?? "").trim().toLowerCase()) {
        case "status":
            return "статус";
        case "working-tree":
            return "рабочее дерево";
        case "basics":
            return "основы";
        case "branching":
            return "ветвление";
        case "navigation":
            return "навигация";
        case "history":
            return "история";
        case "cleanup":
            return "очистка";
        case "planning":
            return "планирование";
        case "remote":
            return "удалённый репозиторий";
        case "inspection":
            return "проверка";
        default:
            return value ? String(value) : "без тега";
    }
}

export function encodeHashSegment(value) {
    return encodeURIComponent(String(value));
}

export function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

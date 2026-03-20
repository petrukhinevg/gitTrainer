const BACKEND_API_UNAVAILABLE_MESSAGE =
    "Backend API недоступен для текущего способа открытия страницы. Запустите приложение через локальный сервер или переключитесь на local-fixture.";

export function resolveDefaultProviderName() {
    return resolveBrowserOrigin() ? "backend-api" : "local-fixture";
}

export function resolveBackendApiUrl(path) {
    const baseOrigin = resolveBrowserOrigin();
    if (!baseOrigin) {
        throw new Error(BACKEND_API_UNAVAILABLE_MESSAGE);
    }

    return new URL(path, baseOrigin);
}

function resolveBrowserOrigin() {
    const protocol = normalizeBrowserValue(window.location.protocol);
    const origin = normalizeBrowserValue(window.location.origin);

    if (!protocol || !origin) {
        return null;
    }

    if (protocol !== "http:" && protocol !== "https:") {
        return null;
    }

    if (origin === "null") {
        return null;
    }

    return origin;
}

function normalizeBrowserValue(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

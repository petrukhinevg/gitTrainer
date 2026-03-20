const BACKEND_API_UNAVAILABLE_MESSAGE =
    "Backend API недоступен для текущего способа открытия страницы. Запустите приложение через локальный сервер или переключитесь на local-fixture.";

export function resolveRuntimeProviderBootstrap(locationLike = globalThis?.window?.location) {
    const backendOrigin = resolveBrowserOrigin(locationLike);
    return {
        backendOrigin,
        defaultProviderName: backendOrigin ? "backend-api" : "local-fixture"
    };
}

export function resolveDefaultProviderName(locationLike = globalThis?.window?.location) {
    return resolveRuntimeProviderBootstrap(locationLike).defaultProviderName;
}

export function resolveBackendApiUrl(path, locationLike = globalThis?.window?.location) {
    const baseOrigin = resolveRuntimeProviderBootstrap(locationLike).backendOrigin;
    if (!baseOrigin) {
        throw new Error(BACKEND_API_UNAVAILABLE_MESSAGE);
    }

    return new URL(path, baseOrigin);
}

function resolveBrowserOrigin(locationLike) {
    const protocol = normalizeBrowserValue(locationLike?.protocol);
    const origin = normalizeBrowserValue(locationLike?.origin);

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

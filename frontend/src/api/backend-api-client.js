import { resolveBackendApiUrl } from "../runtime-origin.js";

export class BackendApiClientError extends Error {
    constructor(
        message,
        {
            status = null,
            failureKind = null,
            failureDisposition = null,
            retryable = null,
            code = null,
            problem = null
        } = {}
    ) {
        super(message);
        this.name = "BackendApiClientError";
        this.status = typeof status === "number" ? status : null;
        this.failureKind = normalizeOptionalValue(failureKind);
        this.failureDisposition = normalizeOptionalValue(failureDisposition);
        this.retryable = typeof retryable === "boolean" ? retryable : null;
        this.code = normalizeOptionalValue(code);
        this.problem = problem && typeof problem === "object" ? problem : null;
    }
}

export function createBackendApiClient(
    fetchImpl = window.fetch.bind(window),
    { resolveUrl = resolveBackendApiUrl } = {}
) {
    return {
        async getJson(path, options = {}) {
            return requestJson(fetchImpl, path, {
                ...options,
                method: "GET",
                resolveUrl
            });
        },
        async postJson(path, payload, options = {}) {
            return requestJson(fetchImpl, path, {
                ...options,
                method: "POST",
                payload,
                resolveUrl
            });
        }
    };
}

async function requestJson(fetchImpl, path, options = {}) {
    const {
        method = "GET",
        payload,
        headers = {},
        fallbackMessage = `Запрос завершился статусом`,
        networkErrorMessage = "Не удалось связаться с сервером. Проверьте подключение и повторите попытку.",
        resolveErrorMessage = defaultResolveErrorMessage,
        resolveFailurePolicy = defaultResolveFailurePolicy,
        errorFactory = createDefaultError,
        resolveUrl = resolveBackendApiUrl
    } = options;

    let url;
    try {
        url = resolveUrl(path);
    } catch (error) {
        throw errorFactory(
            error instanceof Error ? error.message : "Backend API сейчас недоступен.",
            { failureKind: "retryable" }
        );
    }

    let response;
    try {
        response = await fetchImpl(url.toString(), buildRequestInit(method, payload, headers));
    } catch (error) {
        if (error instanceof BackendApiClientError) {
            throw error;
        }

        throw errorFactory(networkErrorMessage, { failureKind: "retryable" });
    }

    if (!response.ok) {
        const problem = await readProblemPayload(response);
        const message = resolveErrorMessage(response, problem, fallbackMessage);
        const failurePolicy = resolveFailurePolicy(response, problem);
        throw errorFactory(message, {
            status: response.status,
            code: problem?.code,
            problem,
            ...failurePolicy
        });
    }

    return response.json();
}

function buildRequestInit(method, payload, headers) {
    const normalizedMethod = String(method ?? "GET").toUpperCase();
    const requestHeaders = {
        "Accept": "application/json",
        ...headers
    };

    if (normalizedMethod === "GET") {
        return {
            method: normalizedMethod,
            headers: requestHeaders
        };
    }

    return {
        method: normalizedMethod,
        headers: {
            "Content-Type": "application/json",
            ...requestHeaders
        },
        body: JSON.stringify(payload)
    };
}

async function readProblemPayload(response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
        return null;
    }

    try {
        return await response.json();
    } catch {
        return null;
    }
}

function defaultResolveErrorMessage(response, problem, fallbackMessage) {
    if (problem && typeof problem.detail === "string" && problem.detail.trim() !== "") {
        return problem.detail;
    }

    if (problem && typeof problem.message === "string" && problem.message.trim() !== "") {
        return problem.message;
    }

    return `${fallbackMessage} ${response.status}`;
}

function defaultResolveFailurePolicy(response, problem) {
    const failureDisposition = normalizeFailureDisposition(problem?.failureDisposition);
    if (failureDisposition) {
        return {
            failureKind: failureDisposition,
            failureDisposition,
            retryable: failureDisposition === "retryable"
        };
    }

    if (typeof problem?.retryable === "boolean") {
        return {
            failureKind: problem.retryable ? "retryable" : "terminal",
            failureDisposition: problem.retryable ? "retryable" : "terminal",
            retryable: problem.retryable
        };
    }

    if (response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500) {
        return {
            failureKind: "retryable",
            failureDisposition: "retryable",
            retryable: true
        };
    }

    return {
        failureKind: "terminal",
        failureDisposition: "terminal",
        retryable: false
    };
}

function createDefaultError(message, metadata) {
    return new BackendApiClientError(message, metadata);
}

function normalizeFailureDisposition(value) {
    const normalized = normalizeOptionalValue(value);
    if (normalized === "retryable" || normalized === "terminal") {
        return normalized;
    }
    return null;
}

function normalizeOptionalValue(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

export class SessionTransportError extends Error {
    constructor(
        message,
        {
            failureKind = "retryable",
            status = null,
            failureDisposition = null,
            retryable = null,
            code = null
        } = {}
    ) {
        super(message);
        this.name = "SessionTransportError";
        this.failureKind = failureKind;
        this.status = typeof status === "number" ? status : null;
        this.failureDisposition = normalizeOptionalSessionValue(failureDisposition);
        this.retryable = typeof retryable === "boolean" ? retryable : null;
        this.code = normalizeOptionalSessionValue(code);
    }
}

export function createSessionTransportError(message, metadata = {}) {
    return new SessionTransportError(message, metadata);
}

export function normalizeRequiredSessionValue(value, message) {
    const normalized = normalizeOptionalSessionValue(value);
    if (!normalized) {
        throw new SessionTransportError(message, { failureKind: "terminal", status: 400 });
    }

    return normalized;
}

export function normalizeOptionalSessionValue(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

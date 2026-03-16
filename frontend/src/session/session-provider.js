import { FIXTURE_SCENARIO_DETAILS } from "../detail/detail-fixtures.js";

const SUPPORTED_ANSWER_TYPES = Object.freeze(["command_text"]);
const EXPECTED_COMMANDS_BY_SCENARIO = Object.freeze({
    "status-basics": "git status",
    "branch-safety": "git branch --show-current",
    "history-cleanup-preview": "git log --oneline --decorate",
    "remote-sync-preview": "git fetch --all --prune"
});

export class SessionTransportError extends Error {
    constructor(message, { failureKind = "retryable", status = null } = {}) {
        super(message);
        this.name = "SessionTransportError";
        this.failureKind = failureKind;
        this.status = typeof status === "number" ? status : null;
    }
}

export function createLocalFixtureSessionProvider({ now = () => new Date() } = {}) {
    let nextSessionNumber = 1;
    let nextSubmissionNumber = 1;
    const sessions = new Map();

    return {
        name: "local-fixture",
        async startSession({ scenarioSlug }) {
            const normalizedSlug = normalizeRequiredValue(
                scenarioSlug,
                "Scenario slug is required to start a session."
            );
            const detail = FIXTURE_SCENARIO_DETAILS[normalizedSlug];
            if (!detail) {
                throw new SessionTransportError(
                    `Scenario detail is unavailable for slug: ${normalizedSlug}`,
                    { failureKind: "terminal", status: 404 }
                );
            }

            const startedAt = now().toISOString();
            const session = {
                sessionId: `fixture-session-${nextSessionNumber++}`,
                scenarioSlug: normalizedSlug,
                scenarioTitle: detail.title,
                scenarioSource: detail.meta?.source ?? "local-fixture",
                startedAt,
                submissionCount: 0,
                lastSubmissionId: null
            };

            sessions.set(session.sessionId, session);

            return {
                sessionId: session.sessionId,
                scenario: {
                    slug: session.scenarioSlug,
                    title: session.scenarioTitle,
                    source: session.scenarioSource
                },
                lifecycle: toLifecyclePayload(session),
                submission: {
                    supportedAnswerTypes: [...SUPPORTED_ANSWER_TYPES],
                    placeholderOutcome: {
                        status: "placeholder",
                        correctness: "not-evaluated",
                        code: "validation-pending",
                        message: "Submission transport is ready, but validation rules are not wired yet."
                    }
                }
            };
        },
        async submitAnswer(sessionId, submission) {
            const normalizedSessionId = normalizeRequiredValue(
                sessionId,
                "Session id is required before an answer can be submitted."
            );
            const session = sessions.get(normalizedSessionId);
            if (!session) {
                throw new SessionTransportError(
                    `Session is unavailable for id: ${normalizedSessionId}`,
                    { failureKind: "terminal", status: 404 }
                );
            }

            const answerType = normalizeOptionalValue(submission?.answerType) ?? "command_text";
            const answer = normalizeRequiredValue(
                submission?.answer,
                "Answer text is required to submit a session attempt."
            );

            const submissionId = `fixture-submission-${nextSubmissionNumber++}`;
            const submittedAt = now().toISOString();

            session.submissionCount += 1;
            session.lastSubmissionId = submissionId;

            return {
                submissionId,
                sessionId: session.sessionId,
                attemptNumber: session.submissionCount,
                submittedAt,
                lifecycle: toLifecyclePayload(session),
                answer: {
                    type: answerType,
                    value: answer
                },
                outcome: evaluateFixtureSubmission(session.scenarioSlug, answerType, answer)
            };
        }
    };
}

export function createUnavailableFixtureSessionProvider() {
    return {
        name: "fixture-unavailable",
        async startSession() {
            throw new SessionTransportError(
                "Session transport is unavailable right now. Try another provider.",
                { failureKind: "retryable", status: 503 }
            );
        },
        async submitAnswer() {
            throw new SessionTransportError(
                "Session transport is unavailable right now. Try another provider.",
                { failureKind: "retryable", status: 503 }
            );
        }
    };
}

export function createBackendApiSessionProvider(fetchImpl = window.fetch.bind(window)) {
    return {
        name: "backend-api",
        async startSession({ scenarioSlug, source = null }) {
            const response = await postJson(fetchImpl, "/api/sessions", {
                scenarioSlug,
                source
            });
            return response;
        },
        async submitAnswer(sessionId, submission) {
            const normalizedSessionId = normalizeRequiredValue(
                sessionId,
                "Session id is required before an answer can be submitted."
            );
            return postJson(fetchImpl, `/api/sessions/${encodeURIComponent(normalizedSessionId)}/submissions`, {
                answerType: normalizeOptionalValue(submission?.answerType) ?? "command_text",
                answer: submission?.answer
            });
        }
    };
}

async function postJson(fetchImpl, path, payload) {
    let response;

    try {
        response = await fetchImpl(new URL(path, window.location.origin), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        if (error instanceof SessionTransportError) {
            throw error;
        }

        throw new SessionTransportError(
            "Session request could not reach the server. Check the backend and try again.",
            { failureKind: "retryable" }
        );
    }

    if (!response.ok) {
        throw await resolveSessionTransportError(response);
    }

    return response.json();
}

async function resolveSessionTransportError(response) {
    const message = await resolveTransportErrorMessage(response);
    return new SessionTransportError(message, {
        failureKind: classifyFailureKind(response.status),
        status: response.status
    });
}

async function resolveTransportErrorMessage(response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
        try {
            const payload = await response.json();
            if (payload && typeof payload.detail === "string" && payload.detail.trim() !== "") {
                return payload.detail;
            }
        } catch {
            // Fall back to a generic message when the response body is not valid JSON.
        }
    }

    return `Session request failed with status ${response.status}`;
}

function classifyFailureKind(status) {
    if (status === 408 || status === 425 || status === 429 || status >= 500) {
        return "retryable";
    }

    return "terminal";
}

function evaluateFixtureSubmission(scenarioSlug, answerType, answer) {
    if (answerType !== "command_text") {
        return {
            status: "evaluated",
            correctness: "unsupported",
            code: "unsupported-answer-type",
            message: `Answer type '${answerType}' is not supported for this submission yet.`
        };
    }

    const expectedCommand = EXPECTED_COMMANDS_BY_SCENARIO[scenarioSlug];
    if (expectedCommand && normalizeCommand(answer) === normalizeCommand(expectedCommand)) {
        return {
            status: "evaluated",
            correctness: "correct",
            code: "expected-command",
            message: "The submitted command matches the current fixture expectation."
        };
    }

    return {
        status: "evaluated",
        correctness: "incorrect",
        code: "unexpected-command",
        message: "The submitted command did not match the current fixture expectation."
    };
}

function toLifecyclePayload(session) {
    return {
        status: "active",
        startedAt: session.startedAt,
        submissionCount: session.submissionCount,
        lastSubmissionId: session.lastSubmissionId
    };
}

function normalizeRequiredValue(value, message) {
    const normalized = normalizeOptionalValue(value);
    if (!normalized) {
        throw new SessionTransportError(message, { failureKind: "terminal", status: 400 });
    }

    return normalized;
}

function normalizeOptionalValue(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

function normalizeCommand(command) {
    return String(command ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

import { FIXTURE_SCENARIO_DETAILS } from "../detail/detail-fixtures.js";
import acceptedCommandsByScenario from "../../../src/main/resources/session/fixture-submission-rules.json";

const SUPPORTED_ANSWER_TYPES = Object.freeze(["command_text"]);
const ACCEPTED_COMMANDS_BY_SCENARIO = Object.freeze(
    Object.fromEntries(
        Object.entries(acceptedCommandsByScenario).map(([scenarioSlug, commands]) => [
            scenarioSlug,
            Object.freeze(Array.isArray(commands) ? [...commands] : [])
        ])
    )
);

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
        this.failureDisposition = normalizeOptionalValue(failureDisposition);
        this.retryable = typeof retryable === "boolean" ? retryable : null;
        this.code = normalizeOptionalValue(code);
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
                        code: "awaiting-first-submission",
                        message: "Session transport is ready. Submit the first answer to receive an evaluated result immediately."
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
    const problem = await readProblemPayload(response);
    const message = resolveTransportErrorMessage(response.status, problem);
    const failurePolicy = resolveFailurePolicy(response.status, problem);
    return new SessionTransportError(message, {
        failureKind: failurePolicy.failureKind,
        status: response.status,
        failureDisposition: failurePolicy.failureDisposition,
        retryable: failurePolicy.retryable,
        code: problem?.code
    });
}

async function readProblemPayload(response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    return null;
}

function resolveTransportErrorMessage(status, problem) {
    if (problem && typeof problem.detail === "string" && problem.detail.trim() !== "") {
        return problem.detail;
    }

    if (problem && typeof problem.message === "string" && problem.message.trim() !== "") {
        return problem.message;
    }

    return `Session request failed with status ${status}`;
}

function resolveFailurePolicy(status, problem) {
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

    if (status === 408 || status === 425 || status === 429 || status >= 500) {
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

function evaluateFixtureSubmission(scenarioSlug, answerType, answer) {
    if (answerType !== "command_text") {
        return {
            status: "evaluated",
            correctness: "unsupported",
            code: "unsupported-answer-type",
            message: "This MVP validation slice only evaluates command_text answers."
        };
    }

    const acceptedCommands = ACCEPTED_COMMANDS_BY_SCENARIO[scenarioSlug];
    if (!acceptedCommands?.length) {
        return {
            status: "evaluated",
            correctness: "incorrect",
            code: "validation-rule-missing",
            message: "No validation rule is available for the active scenario yet."
        };
    }

    const normalizedAnswer = normalizeCommand(answer);
    if (acceptedCommands.some((expectedCommand) => normalizeCommand(expectedCommand) === normalizedAnswer)) {
        return {
            status: "evaluated",
            correctness: "correct",
            code: "expected-command",
            message: "Submitted command matches the expected safe next action for this scenario."
        };
    }

    return {
        status: "evaluated",
        correctness: "incorrect",
        code: "unexpected-command",
        message: "Submitted command does not match the expected safe next action for this scenario."
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

function normalizeFailureDisposition(value) {
    return value === "retryable" || value === "terminal" ? value : null;
}

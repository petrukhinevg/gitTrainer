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
                    },
                    placeholderRetryFeedback: createPlaceholderRetryFeedback({
                        scenarioSlug: session.scenarioSlug,
                        attemptNumber: 0,
                        outcome: null,
                        answer: null
                    })
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
            const outcome = evaluateFixtureSubmission(session.scenarioSlug, answerType, answer);

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
                outcome,
                retryFeedback: createPlaceholderRetryFeedback({
                    scenarioSlug: session.scenarioSlug,
                    attemptNumber: session.submissionCount,
                    outcome,
                    answer
                })
            };
        }
    };
}

export function createUnavailableFixtureSessionProvider() {
    return {
        name: "fixture-unavailable",
        async startSession() {
            throw new SessionTransportError(
                "Session transport is unavailable right now. Try again in a moment.",
                { failureKind: "retryable", status: 503 }
            );
        },
        async submitAnswer() {
            throw new SessionTransportError(
                "Session transport is unavailable right now. Try again in a moment.",
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

function createPlaceholderRetryFeedback({ scenarioSlug = null, attemptNumber = 0, outcome = null, answer = null } = {}) {
    const correctness = normalizeOptionalValue(outcome?.correctness);
    const retryStateStatus = correctness === null
        ? "idle"
        : correctness === "correct"
            ? "complete"
            : "awaiting-policy";
    const eligibility = correctness === null || correctness === "correct"
        ? "not-needed"
        : "pending";
    const guidedPresentation = createFixtureRetryPresentation({
        scenarioSlug,
        attemptNumber,
        outcome,
        answer
    });

    return {
        status: guidedPresentation.status,
        retryState: {
            status: retryStateStatus,
            attemptNumber,
            eligibility
        },
        explanation: guidedPresentation.explanation,
        hint: guidedPresentation.hint
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

    if (isPartialFixtureMatch(scenarioSlug, normalizedAnswer)) {
        return {
            status: "evaluated",
            correctness: "partial",
            code: "partial-command-match",
            message: "Submitted command points toward the right inspection area, but it still needs refinement."
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

function isPartialFixtureMatch(scenarioSlug, normalizedAnswer) {
    if (!normalizedAnswer) {
        return false;
    }

    switch (scenarioSlug) {
        case "status-basics":
        case "branch-safety":
            return normalizedAnswer.startsWith("git status")
                || normalizedAnswer.startsWith("git branch");
        case "history-cleanup-preview":
            return normalizedAnswer.startsWith("git log")
                || normalizedAnswer.startsWith("git show");
        default:
            return false;
    }
}

function createFixtureRetryPresentation({ scenarioSlug, attemptNumber, outcome, answer }) {
    const correctness = normalizeOptionalValue(outcome?.correctness);
    if (!correctness) {
        return {
            status: "placeholder",
            explanation: {
                status: "placeholder",
                title: "Retry guidance",
                tone: "neutral",
                message: "Retry guidance will mount here after the first evaluated submission.",
                details: []
            },
            hint: {
                status: "placeholder",
                level: "baseline",
                message: "Hint progression is idle until the learner receives evaluated feedback.",
                reveals: []
            }
        };
    }

    if (correctness === "correct") {
        return {
            status: "resolved",
            explanation: {
                status: "resolved",
                title: "No retry explanation needed",
                tone: "success",
                message: "This attempt already landed on the safe next action, so the retry panel stays quiet.",
                details: []
            },
            hint: {
                status: "resolved",
                level: "none",
                message: "No extra hint is needed after a correct answer.",
                reveals: []
            }
        };
    }

    const strongHintUnlocked = attemptNumber >= 2;
    const narrative = scenarioGuidanceNarrative(scenarioSlug, correctness, answer);

    return {
        status: "guided",
        explanation: {
            status: "guided",
            title: narrative.title,
            tone: correctness,
            message: narrative.message,
            details: narrative.details
        },
        hint: {
            status: "guided",
            level: strongHintUnlocked ? "strong" : "nudge",
            message: strongHintUnlocked
                ? "A stronger hint is now available because the learner has already missed at least one attempt."
                : "Start with a lighter nudge before revealing the stronger guidance.",
            reveals: strongHintUnlocked
                ? [
                    {
                        id: "nudge",
                        label: "Reveal first hint",
                        title: narrative.nudgeTitle,
                        message: narrative.nudgeMessage
                    },
                    {
                        id: "strong",
                        label: "Reveal stronger hint",
                        title: narrative.strongTitle,
                        message: narrative.strongMessage
                    }
                ]
                : [
                    {
                        id: "nudge",
                        label: "Reveal first hint",
                        title: narrative.nudgeTitle,
                        message: narrative.nudgeMessage
                    }
                ]
        }
    };
}

function scenarioGuidanceNarrative(scenarioSlug, correctness, answer) {
    const trimmedAnswer = normalizeOptionalValue(answer) ?? "the submitted command";

    if (correctness === "unsupported") {
        return {
            title: "Return to supported command input",
            message: "This MVP slice still evaluates only command-style answers, so the next attempt should switch back to a supported command entry.",
            details: [
                "The current transport accepts the request, but the correctness model still marks the answer type as unsupported.",
                "Keep the retry panel focused on getting back to a supported command flow before exploring richer answer formats."
            ],
            nudgeTitle: "Use the command text mode",
            nudgeMessage: "Switch the answer type back to command text and keep the next attempt in a simple inspection command shape.",
            strongTitle: "Mirror the supported answer examples",
            strongMessage: "Look at the supported answer type badge above the composer and mirror that mode before changing the command itself."
        };
    }

    if (correctness === "partial") {
        return {
            title: "You are inspecting the right area, but the command still needs tightening",
            message: `\`${trimmedAnswer}\` points toward the right repository signal, but the task still needs a more precise inspection command before the answer is considered correct.`,
            details: [
                "The learner has started from the correct inspection family, so the retry message should reward that direction instead of treating it as a total miss.",
                "The follow-up hint can narrow the command shape without redesigning the feedback panel."
            ],
            nudgeTitle: "Keep the same inspection family",
            nudgeMessage: "Stay in the same inspection area, but remove extra scope or switch to the canonical safe command for the scenario.",
            strongTitle: "Compare against the exact safe next action",
            strongMessage: "The next safe action is still an inspection-first command. Tighten it until it matches the scenario's expected command text."
        };
    }

    switch (scenarioSlug) {
        case "branch-safety":
            return {
                title: "The branch choice still is not grounded in the task context",
                message: "The retry explanation should steer the learner back to comparing the active branch with the requested task before switching or editing anything.",
                details: [
                    "The current branch already carries intent. The next attempt should explain that intent rather than jumping straight to a branch change.",
                    "A good retry hint here keeps branch purpose and task purpose in the same line of sight."
                ],
                nudgeTitle: "Read the branch purpose first",
                nudgeMessage: "Use the current branch and repository cues to justify whether staying or switching is safer before you submit another command.",
                strongTitle: "Anchor the answer in the active branch indicator",
                strongMessage: "The safest next command is still one that confirms where you are. Use the active branch cue before proposing any move."
            };
        case "history-cleanup-preview":
            return {
                title: "The retry explanation should keep the learner in planning mode",
                message: "This scenario is still about reading the stack and planning a cleanup, so the next attempt should avoid jumping into a rewrite action too early.",
                details: [
                    "The explanation should remind the learner that this task stops at inspection and planning rather than execution.",
                    "Hints can progressively move from general planning language to a stronger reminder about log-style inspection commands."
                ],
                nudgeTitle: "Stay with a history inspection command",
                nudgeMessage: "Use a log-style command that keeps the commit stack visible before choosing any rewrite strategy.",
                strongTitle: "Prefer a decorated one-line history view",
                strongMessage: "The safe next action is still a compact history inspection command that shows branch decoration before any cleanup step."
            };
        default:
            return {
                title: "Inspect before acting",
                message: "The retry explanation should pull the learner back toward repository inspection before any mutating Git action.",
                details: [
                    "This feedback block is intentionally instructional: it highlights why the answer is off without changing the panel shell.",
                    "Hints should escalate from a small nudge to a stronger reminder only after repeated misses."
                ],
                nudgeTitle: "Look at the working tree evidence first",
                nudgeMessage: "Stay with a command that reads the current repository state before you propose cleanup or navigation.",
                strongTitle: "Use the canonical inspection command",
                strongMessage: "The next safe action is still the canonical inspection command for this scenario. Choose the command that reveals state without changing it."
            };
    }
}

function normalizeFailureDisposition(value) {
    return value === "retryable" || value === "terminal" ? value : null;
}

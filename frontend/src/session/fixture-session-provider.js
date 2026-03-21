import { FIXTURE_SCENARIO_DETAILS } from "../detail/detail-fixtures.js";
import acceptedCommandsByScenario from "../../../src/main/resources/session/fixture-submission-rules.json" with { type: "json" };
import { createPlaceholderRetryFeedback } from "./session-fixture-retry-feedback.js";
import { normalizeStartSessionResponse, normalizeSubmissionResponse, SUPPORTED_ANSWER_TYPES } from "./session-response-normalizer.js";
import {
    normalizeOptionalSessionValue,
    normalizeRequiredSessionValue,
    SessionTransportError
} from "./session-transport-error.js";

const ACCEPTED_COMMANDS_BY_SCENARIO = Object.freeze(
    Object.fromEntries(
        Object.entries(acceptedCommandsByScenario).map(([scenarioSlug, commands]) => [
            scenarioSlug,
            Object.freeze(Array.isArray(commands) ? [...commands] : [])
        ])
    )
);

export function createLocalFixtureSessionProvider({ now = () => new Date() } = {}) {
    let nextSessionNumber = 1;
    let nextSubmissionNumber = 1;
    const sessions = new Map();

    return {
        name: "local-fixture",
        async startSession({ scenarioSlug }) {
            const normalizedSlug = normalizeRequiredSessionValue(
                scenarioSlug,
                "Для запуска сессии нужен код сценария."
            );
            const detail = FIXTURE_SCENARIO_DETAILS[normalizedSlug];
            if (!detail) {
                throw new SessionTransportError(
                    `Сценарий не найден: ${normalizedSlug}`,
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

            return normalizeStartSessionResponse({
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
                        message: "Сессия готова. Отправьте первый ответ, чтобы сразу получить результат проверки."
                    },
                    placeholderRetryFeedback: createPlaceholderRetryFeedback({
                        scenarioSlug: session.scenarioSlug,
                        attemptNumber: 0,
                        outcome: null,
                        answer: null
                    })
                }
            });
        },
        async submitAnswer(sessionId, submission) {
            const normalizedSessionId = normalizeRequiredSessionValue(
                sessionId,
                "Перед отправкой ответа нужен id сессии."
            );
            const session = sessions.get(normalizedSessionId);
            if (!session) {
                throw new SessionTransportError(
                    `Сессия недоступна для id: ${normalizedSessionId}`,
                    { failureKind: "terminal", status: 404 }
                );
            }

            const answerType = normalizeOptionalSessionValue(submission?.answerType) ?? "command_text";
            const answer = normalizeRequiredSessionValue(
                submission?.answer,
                "Для отправки попытки нужен текст ответа."
            );

            const submissionId = `fixture-submission-${nextSubmissionNumber++}`;
            const submittedAt = now().toISOString();

            session.submissionCount += 1;
            session.lastSubmissionId = submissionId;
            const outcome = evaluateFixtureSubmission(session.scenarioSlug, answerType, answer);

            return normalizeSubmissionResponse({
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
            });
        }
    };
}

export function createUnavailableFixtureSessionProvider() {
    return {
        name: "fixture-unavailable",
        async startSession() {
            throw new SessionTransportError(
                "Сервис сессий сейчас недоступен. Повторите чуть позже.",
                { failureKind: "retryable", status: 503 }
            );
        },
        async submitAnswer() {
            throw new SessionTransportError(
                "Сервис сессий сейчас недоступен. Повторите чуть позже.",
                { failureKind: "retryable", status: 503 }
            );
        }
    };
}

function evaluateFixtureSubmission(scenarioSlug, answerType, answer) {
    if (answerType !== "command_text") {
        return {
            status: "evaluated",
            correctness: "unsupported",
            code: "unsupported-answer-type",
            message: "Сейчас проверяются только ответы в виде команды."
        };
    }

    const acceptedCommands = ACCEPTED_COMMANDS_BY_SCENARIO[scenarioSlug];
    if (!acceptedCommands?.length) {
        return {
            status: "evaluated",
            correctness: "incorrect",
            code: "validation-rule-missing",
            message: "Для активного сценария пока нет правила валидации."
        };
    }

    const normalizedAnswer = normalizeCommand(answer);
    if (acceptedCommands.some((expectedCommand) => normalizeCommand(expectedCommand) === normalizedAnswer)) {
        return {
            status: "evaluated",
            correctness: "correct",
            code: "expected-command",
            message: "Отправленная команда совпадает с ожидаемым безопасным следующим шагом для этого сценария."
        };
    }

    if (isPartialFixtureMatch(scenarioSlug, normalizedAnswer)) {
        return {
            status: "evaluated",
            correctness: "partial",
            code: "partial-command-match",
            message: "Отправленная команда указывает в правильную область проверки, но её ещё нужно уточнить."
        };
    }

    return {
        status: "evaluated",
        correctness: "incorrect",
        code: "unexpected-command",
        message: "Отправленная команда не совпадает с ожидаемым безопасным следующим шагом для этого сценария."
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

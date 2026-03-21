import test from "node:test";
import assert from "node:assert/strict";

import {
    createBackendApiSessionProvider,
    createLocalFixtureSessionProvider,
    SessionTransportError
} from "../src/session/session-provider.js";
import { createPlaceholderRetryFeedback } from "../src/session/session-fixture-retry-feedback.js";
import {
    normalizeRetryFeedbackBoundary,
    normalizeStartSessionResponse,
    normalizeSubmissionResponse
} from "../src/session/session-response-normalizer.js";

test("normalizeStartSessionResponse stabilizes sparse retry-feedback boundary", () => {
    const response = normalizeStartSessionResponse({
        sessionId: "session-1",
        submission: {
            supportedAnswerTypes: ["command_text", " ", null],
            placeholderRetryFeedback: {
                retryState: {
                    attemptNumber: 3
                },
                explanation: {
                    details: ["первый сигнал", "", null]
                },
                hint: {
                    reveals: [
                        {},
                        {
                            id: "strong",
                            label: "  ",
                            title: "  ",
                            message: "Уточните безопасную команду."
                        }
                    ]
                }
            }
        }
    });

    assert.deepEqual(response.submission.supportedAnswerTypes, ["command_text"]);
    assert.deepEqual(response.submission.placeholderRetryFeedback, {
        status: "placeholder",
        retryState: {
            status: "idle",
            attemptNumber: 3,
            eligibility: "not-needed"
        },
        explanation: {
            status: "placeholder",
            title: "Подсказка для повтора",
            tone: "neutral",
            message: "Подсказка для повтора появится здесь после первой проверенной отправки.",
            details: ["первый сигнал"]
        },
        hint: {
            status: "placeholder",
            level: "baseline",
            message: "Прогресс подсказок остаётся в ожидании, пока пользователь не получит проверенную обратную связь.",
            reveals: [
                {
                    id: "hint-1",
                    label: "Показать подсказку",
                    title: "Подсказка",
                    message: "Дополнительная подсказка недоступна."
                },
                {
                    id: "strong",
                    label: "Показать подсказку",
                    title: "Подсказка",
                    message: "Уточните безопасную команду."
                }
            ]
        }
    });
});

test("normalizeSubmissionResponse preserves stable retry-feedback defaults", () => {
    const response = normalizeSubmissionResponse({
        submissionId: "submission-1",
        retryFeedback: {
            status: "guided",
            retryState: {
                status: "retry-available",
                eligibility: "eligible"
            },
            explanation: {
                status: "guided",
                title: "Вернитесь к проверке",
                tone: "partial",
                message: "Команду ещё нужно уточнить."
            }
        }
    });

    assert.deepEqual(response.retryFeedback, {
        status: "guided",
        retryState: {
            status: "retry-available",
            attemptNumber: 0,
            eligibility: "eligible"
        },
        explanation: {
            status: "guided",
            title: "Вернитесь к проверке",
            tone: "partial",
            message: "Команду ещё нужно уточнить.",
            details: []
        },
        hint: {
            status: "placeholder",
            level: "baseline",
            message: "Прогресс подсказок остаётся в ожидании, пока пользователь не получит проверенную обратную связь.",
            reveals: []
        }
    });
});

test("local fixture provider keeps retry-feedback shape stable across attempts", async () => {
    const provider = createLocalFixtureSessionProvider({
        now: () => new Date("2026-03-21T10:15:00Z")
    });

    const session = await provider.startSession({ scenarioSlug: "branch-safety" });
    assert.deepEqual(session.submission.placeholderRetryFeedback, normalizeRetryFeedbackBoundary(
        createPlaceholderRetryFeedback({
            scenarioSlug: "branch-safety",
            attemptNumber: 0
        })
    ));

    const firstAttempt = await provider.submitAnswer(session.sessionId, {
        answerType: "command_text",
        answer: "git branch"
    });
    assert.equal(firstAttempt.retryFeedback.status, "guided");
    assert.equal(firstAttempt.retryFeedback.retryState.status, "retry-available");
    assert.equal(firstAttempt.retryFeedback.retryState.attemptNumber, 1);
    assert.equal(firstAttempt.retryFeedback.hint.reveals.length, 1);

    const secondAttempt = await provider.submitAnswer(session.sessionId, {
        answerType: "command_text",
        answer: "git switch main"
    });
    assert.equal(secondAttempt.retryFeedback.status, "guided");
    assert.equal(secondAttempt.retryFeedback.retryState.status, "retry-available");
    assert.equal(secondAttempt.retryFeedback.retryState.attemptNumber, 2);
    assert.equal(secondAttempt.retryFeedback.hint.level, "strong");
    assert.equal(secondAttempt.retryFeedback.hint.reveals.length, 2);
});

test("backend provider normalizes sparse success payload through shared boundary seam", async () => {
    const provider = createBackendApiSessionProvider(
        async () => ({
            ok: true,
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            async json() {
                return {
                    sessionId: "session-1",
                    submission: {}
                };
            }
        }),
        {
            resolveUrl: (path) => new URL(path, "http://backend.test")
        }
    );

    const session = await provider.startSession({ scenarioSlug: "branch-safety" });

    assert.deepEqual(session.submission.supportedAnswerTypes, ["command_text"]);
    assert.deepEqual(session.submission.placeholderRetryFeedback, {
        status: "placeholder",
        retryState: {
            status: "idle",
            attemptNumber: 0,
            eligibility: "not-needed"
        },
        explanation: {
            status: "placeholder",
            title: "Подсказка для повтора",
            tone: "neutral",
            message: "Подсказка для повтора появится здесь после первой проверенной отправки.",
            details: []
        },
        hint: {
            status: "placeholder",
            level: "baseline",
            message: "Прогресс подсказок остаётся в ожидании, пока пользователь не получит проверенную обратную связь.",
            reveals: []
        }
    });
});

test("backend provider converts problem details to SessionTransportError", async () => {
    const provider = createBackendApiSessionProvider(
        async () => ({
            ok: false,
            status: 503,
            headers: new Headers({ "content-type": "application/json" }),
            async json() {
                return {
                    detail: "Сервис сессий перегружен.",
                    code: "session-service-busy",
                    failureDisposition: "retryable"
                };
            }
        }),
        {
            resolveUrl: (path) => new URL(path, "http://backend.test")
        }
    );

    await assert.rejects(
        provider.startSession({ scenarioSlug: "branch-safety" }),
        (error) => {
            assert.ok(error instanceof SessionTransportError);
            assert.equal(error.message, "Сервис сессий перегружен.");
            assert.equal(error.status, 503);
            assert.equal(error.code, "session-service-busy");
            assert.equal(error.failureKind, "retryable");
            assert.equal(error.failureDisposition, "retryable");
            assert.equal(error.retryable, true);
            return true;
        }
    );
});

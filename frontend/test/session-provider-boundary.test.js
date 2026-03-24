import test from "node:test";
import assert from "node:assert/strict";

import {
    createBackendApiSessionProvider,
    SessionTransportError
} from "../src/session/session-provider.js";
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
        terminalOutput: {
            stdout: "## main\n M README.md",
            stderr: ""
        },
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
    assert.deepEqual(response.terminalOutput, {
        stdout: "## main\n M README.md",
        stderr: ""
    });
});

test("normalizeRetryFeedbackBoundary stabilizes sparse guided payload", () => {
    const feedback = normalizeRetryFeedbackBoundary({
        status: "guided",
        retryState: {
            attemptNumber: 2
        },
        explanation: {
            message: "Команду ещё нужно уточнить."
        },
        hint: {
            reveals: [
                {
                    message: "Сначала подтвердите рабочую ветку."
                }
            ]
        }
    });

    assert.deepEqual(feedback, {
        status: "guided",
        retryState: {
            status: "idle",
            attemptNumber: 2,
            eligibility: "not-needed"
        },
        explanation: {
            status: "placeholder",
            title: "Подсказка для повтора",
            tone: "neutral",
            message: "Команду ещё нужно уточнить.",
            details: []
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
                    message: "Сначала подтвердите рабочую ветку."
                }
            ]
        }
    });
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

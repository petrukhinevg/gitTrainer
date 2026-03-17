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
            const normalizedSessionId = normalizeRequiredValue(
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

            const answerType = normalizeOptionalValue(submission?.answerType) ?? "command_text";
            const answer = normalizeRequiredValue(
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

export function createBackendApiSessionProvider(fetchImpl = window.fetch.bind(window)) {
    return {
        name: "backend-api",
        async startSession({ scenarioSlug, source = null }) {
            const response = await postJson(fetchImpl, "/api/sessions", {
                scenarioSlug,
                source
            });
            return normalizeStartSessionResponse(response);
        },
        async submitAnswer(sessionId, submission) {
            const normalizedSessionId = normalizeRequiredValue(
                sessionId,
                "Перед отправкой ответа нужен id сессии."
            );
            const response = await postJson(fetchImpl, `/api/sessions/${encodeURIComponent(normalizedSessionId)}/submissions`, {
                answerType: normalizeOptionalValue(submission?.answerType) ?? "command_text",
                answer: submission?.answer
            });
            return normalizeSubmissionResponse(response);
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
            "Не удалось связаться с сервером. Проверьте подключение и повторите попытку.",
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

    return `Запрос сессии завершился статусом ${status}`;
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
            : "retry-available";
    const eligibility = correctness === null || correctness === "correct"
        ? "not-needed"
        : "eligible";
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

function normalizeStartSessionResponse(response) {
    const safeResponse = response ?? {};
    const submission = safeResponse.submission ?? {};

    return {
        ...safeResponse,
        submission: {
            ...submission,
            supportedAnswerTypes: Array.isArray(submission.supportedAnswerTypes)
                ? submission.supportedAnswerTypes.filter((answerType) => typeof answerType === "string" && answerType.trim() !== "")
                : [...SUPPORTED_ANSWER_TYPES],
            placeholderRetryFeedback: normalizeRetryFeedbackBoundary(submission.placeholderRetryFeedback)
        }
    };
}

function normalizeSubmissionResponse(response) {
    const safeResponse = response ?? {};
    return {
        ...safeResponse,
        retryFeedback: normalizeRetryFeedbackBoundary(safeResponse.retryFeedback)
    };
}

function normalizeRetryFeedbackBoundary(retryFeedback) {
    const safeFeedback = retryFeedback ?? {};
    const retryState = safeFeedback.retryState ?? {};
    const explanation = safeFeedback.explanation ?? {};
    const hint = safeFeedback.hint ?? {};

    return {
        status: normalizeOptionalValue(safeFeedback.status) ?? "placeholder",
        retryState: {
            status: normalizeOptionalValue(retryState.status) ?? "idle",
            attemptNumber: typeof retryState.attemptNumber === "number" ? retryState.attemptNumber : 0,
            eligibility: normalizeOptionalValue(retryState.eligibility) ?? "not-needed"
        },
        explanation: {
            status: normalizeOptionalValue(explanation.status) ?? "placeholder",
            title: normalizeOptionalValue(explanation.title) ?? "Подсказка для повтора",
            tone: normalizeOptionalValue(explanation.tone) ?? "neutral",
            message: normalizeOptionalValue(explanation.message)
                ?? "Подсказка для повтора появится здесь после первой проверенной отправки.",
            details: Array.isArray(explanation.details)
                ? explanation.details.filter((detail) => typeof detail === "string" && detail.trim() !== "")
                : []
        },
        hint: {
            status: normalizeOptionalValue(hint.status) ?? "placeholder",
            level: normalizeOptionalValue(hint.level) ?? "baseline",
            message: normalizeOptionalValue(hint.message)
                ?? "Прогресс подсказок остаётся в ожидании, пока пользователь не получит проверенную обратную связь.",
            reveals: Array.isArray(hint.reveals)
                ? hint.reveals
                    .filter((item) => item && typeof item === "object")
                    .map((item, index) => ({
                        id: normalizeOptionalValue(item.id) ?? `hint-${index + 1}`,
                        label: normalizeOptionalValue(item.label) ?? "Показать подсказку",
                        title: normalizeOptionalValue(item.title) ?? "Подсказка",
                        message: normalizeOptionalValue(item.message) ?? "Дополнительная подсказка недоступна."
                    }))
                : []
        }
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
        };
    }

    if (correctness === "correct") {
        return {
            status: "resolved",
            explanation: {
                status: "resolved",
                title: "Повторное объяснение не требуется",
                tone: "success",
                message: "Эта попытка уже привела к безопасному следующему шагу, поэтому панель повтора остаётся спокойной.",
                details: []
            },
            hint: {
                status: "resolved",
                level: "none",
                message: "После правильного ответа дополнительная подсказка не нужна.",
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
                ? "Теперь доступна усиленная подсказка, потому что пользователь уже промахнулся как минимум один раз."
                : "Сначала дайте более мягкий намёк, а уже потом открывайте сильную подсказку.",
            reveals: strongHintUnlocked
                ? [
                    {
                        id: "nudge",
                        label: "Показать первую подсказку",
                        title: narrative.nudgeTitle,
                        message: narrative.nudgeMessage
                    },
                    {
                        id: "strong",
                        label: "Показать усиленную подсказку",
                        title: narrative.strongTitle,
                        message: narrative.strongMessage
                    }
                ]
                : [
                    {
                        id: "nudge",
                        label: "Показать первую подсказку",
                        title: narrative.nudgeTitle,
                        message: narrative.nudgeMessage
                    }
                ]
        }
    };
}

function scenarioGuidanceNarrative(scenarioSlug, correctness, answer) {
    const trimmedAnswer = normalizeOptionalValue(answer) ?? "отправленная команда";

    if (correctness === "unsupported") {
        return {
            title: "Вернитесь к поддерживаемому вводу команды",
            message: "Сейчас проверяются только ответы в виде команды, поэтому перед следующей попыткой нужно вернуть поддерживаемый формат.",
            details: [
                "Запрос принимается, но такой тип ответа всё ещё считается неподдерживаемым.",
                "Панель повтора должна сначала вернуть пользователя к поддерживаемому командному формату, а уже потом пробовать более богатые варианты ответа."
            ],
            nudgeTitle: "Используйте режим текста команды",
            nudgeMessage: "Переключите тип ответа обратно на текст команды и оставьте следующую попытку в форме простой команды проверки.",
            strongTitle: "Ориентируйтесь на поддерживаемый пример",
            strongMessage: "Посмотрите на бейдж поддерживаемого типа ответа над формой и сначала вернитесь к этому режиму."
        };
    }

    if (correctness === "partial") {
        return {
            title: "Вы смотрите в правильную область, но команду ещё нужно уточнить",
            message: `\`${trimmedAnswer}\` указывает на правильный сигнал репозитория, но задаче всё ещё нужна более точная команда проверки, прежде чем ответ станет правильным.`,
            details: [
                "Пользователь уже стартовал из правильного семейства команд проверки, поэтому сообщение о повторе должно поддержать это направление, а не считать ответ полным промахом.",
                "Следующая подсказка может сузить форму команды, не меняя саму панель обратной связи."
            ],
            nudgeTitle: "Останьтесь в том же семействе проверок",
            nudgeMessage: "Оставайтесь в той же зоне проверки, но уберите лишний охват или переключитесь на каноничную безопасную команду для сценария.",
            strongTitle: "Сверьтесь с точным безопасным шагом",
            strongMessage: "Следующее безопасное действие всё ещё строится на команде проверки. Уточните её, пока она не совпадёт с ожидаемым текстом."
        };
    }

    switch (scenarioSlug) {
        case "branch-safety":
            return {
                title: "Выбор ветки всё ещё не опирается на контекст задачи",
                message: "Объяснение для повтора должно вернуть пользователя к сравнению активной ветки с задачей до любого переключения или редактирования.",
                details: [
                    "Текущая ветка уже несёт свой смысл. Следующая попытка должна объяснить этот смысл, а не сразу прыгать к смене ветки.",
                    "Хорошая подсказка в этом месте держит назначение ветки и цель задачи в одном фокусе."
                ],
                nudgeTitle: "Сначала прочитайте назначение ветки",
                nudgeMessage: "Используйте текущую ветку и подсказки репозитория, чтобы обосновать, безопаснее ли остаться или переключиться, прежде чем отправлять новую команду.",
                strongTitle: "Привяжите ответ к индикатору активной ветки",
                strongMessage: "Самая безопасная следующая команда всё ещё должна подтверждать, где вы находитесь. Используйте подсказку активной ветки до любого движения."
            };
        case "history-cleanup-preview":
            return {
                title: "Объяснение для повтора должно удержать пользователя в режиме планирования",
                message: "Этот сценарий всё ещё про чтение стека коммитов и план очистки, поэтому следующая попытка не должна слишком рано переходить к переписыванию истории.",
                details: [
                    "Объяснение должно напомнить, что эта задача заканчивается на проверке и планировании, а не на выполнении.",
                    "Подсказки могут постепенно переходить от общего языка планирования к более сильному напоминанию о log-подобных командах проверки."
                ],
                nudgeTitle: "Останьтесь на команде проверки истории",
                nudgeMessage: "Используйте команду в стиле `log`, которая держит стек коммитов на виду до выбора стратегии переписывания.",
                strongTitle: "Предпочтите украшенный однострочный просмотр истории",
                strongMessage: "Безопасный следующий шаг всё ещё строится на компактной команде проверки истории, которая показывает декорации веток до любой очистки."
            };
        default:
            return {
                title: "Сначала проверьте, потом действуйте",
                message: "Объяснение для повтора должно возвращать пользователя к проверке репозитория до любого изменяющего Git-действия.",
                details: [
                    "Этот блок обратной связи специально сделан обучающим: он показывает, почему ответ не подходит, не ломая структуру экрана.",
                    "Подсказки должны усиливаться от лёгкого намёка к более сильному напоминанию только после повторных промахов."
                ],
                nudgeTitle: "Сначала посмотрите на состояние рабочего дерева",
                nudgeMessage: "Оставайтесь на команде, которая читает текущее состояние репозитория, прежде чем предлагать очистку или навигацию.",
                strongTitle: "Используйте каноничную команду проверки",
                strongMessage: "Следующее безопасное действие всё ещё строится на каноничной команде проверки для этого сценария. Выберите команду, которая раскрывает состояние и ничего не меняет."
            };
    }
}

function normalizeFailureDisposition(value) {
    return value === "retryable" || value === "terminal" ? value : null;
}

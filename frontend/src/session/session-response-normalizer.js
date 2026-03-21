import { normalizeOptionalSessionValue } from "./session-transport-error.js";

export const SUPPORTED_ANSWER_TYPES = Object.freeze(["command_text"]);

export function normalizeStartSessionResponse(response) {
    const safeResponse = response ?? {};
    const submission = safeResponse.submission ?? {};

    return {
        ...safeResponse,
        submission: {
            ...submission,
            supportedAnswerTypes: Array.isArray(submission.supportedAnswerTypes)
                ? submission.supportedAnswerTypes.filter(
                    (answerType) => typeof answerType === "string" && answerType.trim() !== ""
                )
                : [...SUPPORTED_ANSWER_TYPES],
            placeholderRetryFeedback: normalizeRetryFeedbackBoundary(submission.placeholderRetryFeedback)
        }
    };
}

export function normalizeSubmissionResponse(response) {
    const safeResponse = response ?? {};
    return {
        ...safeResponse,
        retryFeedback: normalizeRetryFeedbackBoundary(safeResponse.retryFeedback)
    };
}

export function normalizeRetryFeedbackBoundary(retryFeedback) {
    const safeFeedback = retryFeedback ?? {};
    const retryState = safeFeedback.retryState ?? {};
    const explanation = safeFeedback.explanation ?? {};
    const hint = safeFeedback.hint ?? {};

    return {
        status: normalizeOptionalSessionValue(safeFeedback.status) ?? "placeholder",
        retryState: {
            status: normalizeOptionalSessionValue(retryState.status) ?? "idle",
            attemptNumber: typeof retryState.attemptNumber === "number" ? retryState.attemptNumber : 0,
            eligibility: normalizeOptionalSessionValue(retryState.eligibility) ?? "not-needed"
        },
        explanation: {
            status: normalizeOptionalSessionValue(explanation.status) ?? "placeholder",
            title: normalizeOptionalSessionValue(explanation.title) ?? "Подсказка для повтора",
            tone: normalizeOptionalSessionValue(explanation.tone) ?? "neutral",
            message: normalizeOptionalSessionValue(explanation.message)
                ?? "Подсказка для повтора появится здесь после первой проверенной отправки.",
            details: Array.isArray(explanation.details)
                ? explanation.details.filter((detail) => typeof detail === "string" && detail.trim() !== "")
                : []
        },
        hint: {
            status: normalizeOptionalSessionValue(hint.status) ?? "placeholder",
            level: normalizeOptionalSessionValue(hint.level) ?? "baseline",
            message: normalizeOptionalSessionValue(hint.message)
                ?? "Прогресс подсказок остаётся в ожидании, пока пользователь не получит проверенную обратную связь.",
            reveals: Array.isArray(hint.reveals)
                ? hint.reveals
                    .filter((item) => item && typeof item === "object")
                    .map((item, index) => ({
                        id: normalizeOptionalSessionValue(item.id) ?? `hint-${index + 1}`,
                        label: normalizeOptionalSessionValue(item.label) ?? "Показать подсказку",
                        title: normalizeOptionalSessionValue(item.title) ?? "Подсказка",
                        message: normalizeOptionalSessionValue(item.message) ?? "Дополнительная подсказка недоступна."
                    }))
                : []
        }
    };
}

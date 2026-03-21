import { createBackendApiClient } from "../api/backend-api-client.js";
import { normalizeStartSessionResponse, normalizeSubmissionResponse } from "./session-response-normalizer.js";
import {
    createSessionTransportError,
    normalizeOptionalSessionValue,
    normalizeRequiredSessionValue
} from "./session-transport-error.js";

export function createBackendApiSessionProvider(
    fetchImpl = window.fetch.bind(window),
    backendApiClientOptions = {}
) {
    const client = createBackendApiClient(fetchImpl, backendApiClientOptions);

    return {
        name: "backend-api",
        async startSession({ scenarioSlug, source = null }) {
            const response = await client.postJson("/api/sessions", {
                scenarioSlug,
                source
            }, {
                fallbackMessage: "Запрос сессии завершился статусом",
                networkErrorMessage: "Не удалось связаться с сервером. Проверьте подключение и повторите попытку.",
                errorFactory: createSessionTransportError
            });
            return normalizeStartSessionResponse(response);
        },
        async submitAnswer(sessionId, submission) {
            const normalizedSessionId = normalizeRequiredSessionValue(
                sessionId,
                "Перед отправкой ответа нужен id сессии."
            );
            const response = await client.postJson(`/api/sessions/${encodeURIComponent(normalizedSessionId)}/submissions`, {
                answerType: normalizeOptionalSessionValue(submission?.answerType) ?? "command_text",
                answer: submission?.answer
            }, {
                fallbackMessage: "Запрос сессии завершился статусом",
                networkErrorMessage: "Не удалось связаться с сервером. Проверьте подключение и повторите попытку.",
                errorFactory: createSessionTransportError
            });
            return normalizeSubmissionResponse(response);
        }
    };
}

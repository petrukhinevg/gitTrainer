import { createBackendApiClient } from "../api/backend-api-client.js";

export function createBackendApiDetailProvider(fetchImpl = window.fetch.bind(window)) {
    const client = createBackendApiClient(fetchImpl);

    return {
        name: "backend-api",
        async loadScenarioDetail(slug) {
            return client.getJson(`/api/scenarios/${encodeURIComponent(slug)}`, {
                fallbackMessage: "Запрос деталей сценария завершился статусом"
            });
        }
    };
}

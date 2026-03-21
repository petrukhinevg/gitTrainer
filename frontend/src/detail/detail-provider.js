import { FIXTURE_SCENARIO_DETAILS } from "./detail-fixtures.js";
import { createBackendApiClient } from "../api/backend-api-client.js";

export function createLocalFixtureDetailProvider() {
    return {
        name: "local-fixture",
        async loadScenarioDetail(slug) {
            const detail = FIXTURE_SCENARIO_DETAILS[slug];
            if (!detail) {
                throw new Error(`Сценарий не найден: ${slug}`);
            }

            return structuredClone(detail);
        }
    };
}

export function createUnavailableFixtureDetailProvider() {
    return {
        name: "fixture-unavailable",
        async loadScenarioDetail() {
            throw new Error("Источник деталей сценария сейчас недоступен. Повторите чуть позже.");
        }
    };
}

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

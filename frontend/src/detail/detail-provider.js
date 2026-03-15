import { FIXTURE_SCENARIO_DETAILS } from "./detail-fixtures.js";

export function createLocalFixtureDetailProvider() {
    return {
        name: "local-fixture",
        async loadScenarioDetail(slug) {
            const detail = FIXTURE_SCENARIO_DETAILS[slug];
            if (!detail) {
                throw new Error(`Scenario detail is unavailable for slug: ${slug}`);
            }

            return structuredClone(detail);
        }
    };
}

export function createUnavailableFixtureDetailProvider() {
    return {
        name: "fixture-unavailable",
        async loadScenarioDetail() {
            throw new Error("Scenario detail source is unavailable right now. Try another provider.");
        }
    };
}

export function createBackendApiDetailProvider(fetchImpl = window.fetch.bind(window)) {
    return {
        name: "backend-api",
        async loadScenarioDetail(slug) {
            const url = new URL(`/api/scenarios/${encodeURIComponent(slug)}`, window.location.origin);
            const response = await fetchImpl(url);
            if (!response.ok) {
                throw new Error(`Scenario detail request failed with status ${response.status}`);
            }
            return response.json();
        }
    };
}

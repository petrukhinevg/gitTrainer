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
                throw new Error(await resolveDetailErrorMessage(response));
            }
            return response.json();
        }
    };
}

async function resolveDetailErrorMessage(response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
        try {
            const payload = await response.json();
            if (payload && typeof payload.detail === "string" && payload.detail.trim() !== "") {
                return payload.detail;
            }
        } catch {
            // Fall back to a generic transport message when the body is not valid JSON.
        }
    }

    return `Scenario detail request failed with status ${response.status}`;
}

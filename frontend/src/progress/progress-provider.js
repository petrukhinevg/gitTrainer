import { FIXTURE_PROGRESS_SUMMARY } from "./progress-fixtures.js";

export function createLocalFixtureProgressProvider() {
    return {
        name: "local-fixture",
        async loadProgressSummary() {
            return normalizeProgressSummaryResponse(structuredClone(FIXTURE_PROGRESS_SUMMARY));
        }
    };
}

export function createUnavailableFixtureProgressProvider() {
    return {
        name: "fixture-unavailable",
        async loadProgressSummary() {
            throw new Error("Progress summary is unavailable right now. Try again in a moment.");
        }
    };
}

export function createBackendApiProgressProvider(fetchImpl = window.fetch.bind(window)) {
    return {
        name: "backend-api",
        async loadProgressSummary() {
            const url = new URL("/api/progress", window.location.origin);
            const response = await fetchImpl(url);
            if (!response.ok) {
                throw new Error(await resolveProgressErrorMessage(response));
            }
            return normalizeProgressSummaryResponse(await response.json());
        }
    };
}

function normalizeProgressSummaryResponse(payload) {
    const items = Array.isArray(payload?.items) ? payload.items.map(normalizeSummaryItem) : [];
    const recentActivity = Array.isArray(payload?.recentActivity)
        ? payload.recentActivity.map(normalizeRecentActivity)
        : [];
    const recommendations = normalizeRecommendations(payload?.recommendations);

    return {
        items,
        recentActivity,
        recommendations,
        meta: {
            source: normalizeOptionalValue(payload?.meta?.source) ?? "unknown"
        }
    };
}

function normalizeSummaryItem(item) {
    return {
        scenarioSlug: normalizeOptionalValue(item?.scenarioSlug) ?? "unknown-scenario",
        scenarioTitle: normalizeOptionalValue(item?.scenarioTitle) ?? "Unknown scenario",
        status: normalizeOptionalValue(item?.status) ?? "not_started",
        attemptCount: normalizeCount(item?.attemptCount),
        completionCount: normalizeCount(item?.completionCount),
        lastActivityAt: normalizeOptionalValue(item?.lastActivityAt)
    };
}

function normalizeRecentActivity(activity) {
    return {
        scenarioSlug: normalizeOptionalValue(activity?.scenarioSlug) ?? "unknown-scenario",
        scenarioTitle: normalizeOptionalValue(activity?.scenarioTitle) ?? "Unknown scenario",
        status: normalizeOptionalValue(activity?.status) ?? "not_started",
        eventType: normalizeOptionalValue(activity?.eventType) ?? "started",
        happenedAt: normalizeOptionalValue(activity?.happenedAt) ?? null
    };
}

function normalizeRecommendations(recommendations) {
    return {
        solved: Array.isArray(recommendations?.solved)
            ? recommendations.solved.map(normalizeRecommendationScenario)
            : [],
        attempted: Array.isArray(recommendations?.attempted)
            ? recommendations.attempted.map(normalizeRecommendationScenario)
            : [],
        next: recommendations?.next ? normalizeRecommendationScenario(recommendations.next) : null,
        rationale: normalizeOptionalValue(recommendations?.rationale)
            ?? "Recommendation guidance is unavailable."
    };
}

function normalizeRecommendationScenario(scenario) {
    return {
        scenarioSlug: normalizeOptionalValue(scenario?.scenarioSlug) ?? "unknown-scenario",
        scenarioTitle: normalizeOptionalValue(scenario?.scenarioTitle) ?? "Unknown scenario"
    };
}

function normalizeCount(value) {
    return Number.isFinite(value) ? Number(value) : 0;
}

function normalizeOptionalValue(value) {
    const normalized = String(value ?? "").trim();
    return normalized.length ? normalized : null;
}

async function resolveProgressErrorMessage(response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
        try {
            const payload = await response.json();
            if (payload && typeof payload.detail === "string" && payload.detail.trim() !== "") {
                return payload.detail;
            }
        } catch {
            // Fall back to status-based copy when the body cannot be parsed.
        }
    }

    return `Progress request failed with status ${response.status}`;
}

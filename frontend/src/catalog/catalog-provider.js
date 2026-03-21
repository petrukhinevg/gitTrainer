import { FIXTURE_SCENARIO_CATALOG } from "./catalog-fixtures.js";
import { createBackendApiClient } from "../api/backend-api-client.js";

export function createLocalFixtureCatalogProvider() {
    return {
        name: "local-fixture",
        async browseCatalog(query) {
            const items = applyCatalogQueryPolicy(FIXTURE_SCENARIO_CATALOG.items, query);
            return {
                items,
                meta: {
                    source: "local-fixture",
                    query: {
                        difficulty: query.difficulty ?? null,
                        tags: [...query.tags],
                        sort: query.sort ?? null
                    }
                }
            };
        }
    };
}

export function createUnavailableFixtureCatalogProvider() {
    return {
        name: "fixture-unavailable",
        async browseCatalog() {
            throw new Error("Источник каталога сейчас недоступен. Повторите чуть позже.");
        }
    };
}

export function createBackendApiCatalogProvider(fetchImpl = window.fetch.bind(window)) {
    const client = createBackendApiClient(fetchImpl);

    return {
        name: "backend-api",
        async browseCatalog(query) {
            const url = new URL("/api/scenarios", "http://backend.local");
            if (query.difficulty) {
                url.searchParams.set("difficulty", query.difficulty);
            }
            if (query.sort) {
                url.searchParams.set("sort", query.sort);
            }
            for (const tag of query.tags) {
                url.searchParams.append("tag", tag);
            }

            return client.getJson(`${url.pathname}${url.search}`, {
                fallbackMessage: "Запрос каталога завершился статусом"
            });
        }
    };
}

function applyCatalogQueryPolicy(items, query) {
    return [...items]
        .filter((item) => matchesDifficulty(item, query))
        .filter((item) => matchesTags(item, query))
        .sort(resolveComparator(query));
}

function matchesDifficulty(item, query) {
    if (!query.difficulty) {
        return true;
    }

    const requestedDifficulty = normalize(query.difficulty);
    return requestedDifficulty === normalize(item.difficulty);
}

function matchesTags(item, query) {
    if (!query.tags.length) {
        return true;
    }

    const itemTags = item.tags.map(normalize);
    return query.tags.map(normalize).every((tag) => itemTags.includes(tag));
}

function resolveComparator(query) {
    const sort = normalize(query.sort ?? "title");
    if (sort === "difficulty") {
        return (left, right) => difficultyRank(left.difficulty) - difficultyRank(right.difficulty)
            || left.title.localeCompare(right.title);
    }

    return (left, right) => left.title.localeCompare(right.title);
}

function difficultyRank(difficulty) {
    return normalize(difficulty) === "beginner" ? 0 : 1;
}

function normalize(value) {
    return String(value).trim().toLowerCase();
}

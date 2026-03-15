import { FIXTURE_SCENARIO_CATALOG } from "./catalog-fixtures.js";

export function createLocalFixtureCatalogProvider() {
    return {
        name: "local-fixture",
        async browseCatalog(query) {
            return {
                items: FIXTURE_SCENARIO_CATALOG.items,
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

export function createBackendApiCatalogProvider(fetchImpl = window.fetch.bind(window)) {
    return {
        name: "backend-api",
        async browseCatalog(query) {
            const url = new URL("/api/scenarios", window.location.origin);
            if (query.difficulty) {
                url.searchParams.set("difficulty", query.difficulty);
            }
            if (query.sort) {
                url.searchParams.set("sort", query.sort);
            }
            for (const tag of query.tags) {
                url.searchParams.append("tag", tag);
            }

            const response = await fetchImpl(url);
            if (!response.ok) {
                throw new Error(`Catalog request failed with status ${response.status}`);
            }
            return response.json();
        }
    };
}

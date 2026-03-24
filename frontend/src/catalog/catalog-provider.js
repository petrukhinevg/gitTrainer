import { createBackendApiClient } from "../api/backend-api-client.js";

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

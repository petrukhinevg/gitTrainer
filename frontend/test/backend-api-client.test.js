import test from "node:test";
import assert from "node:assert/strict";

import { BackendApiClientError, createBackendApiClient } from "../src/api/backend-api-client.js";

const resolveUrl = (path) => new URL(path, "http://localhost:5173");

test("backend api client parses problem detail and failure policy", async () => {
    const client = createBackendApiClient(
        async () => jsonResponse(
            {
                title: "Источник сценариев недоступен",
                detail: "Источник каталога сейчас недоступен. Выберите другой источник или повторите позже.",
                code: "scenario-source-unavailable",
                failureDisposition: "retryable",
                retryable: true
            },
            { status: 503 }
        ),
        { resolveUrl }
    );

    await assert.rejects(
        () => client.getJson("/api/scenarios", { fallbackMessage: "Запрос каталога завершился статусом" }),
        (error) => {
            assert.ok(error instanceof BackendApiClientError);
            assert.equal(error.message, "Источник каталога сейчас недоступен. Выберите другой источник или повторите позже.");
            assert.equal(error.status, 503);
            assert.equal(error.failureKind, "retryable");
            assert.equal(error.code, "scenario-source-unavailable");
            return true;
        }
    );
});

test("backend api client falls back to status-based terminal error when problem payload is absent", async () => {
    const client = createBackendApiClient(
        async () => ({
            ok: false,
            status: 404,
            headers: new Headers({ "content-type": "text/plain" })
        }),
        { resolveUrl }
    );

    await assert.rejects(
        () => client.getJson("/api/scenarios/missing", { fallbackMessage: "Запрос деталей сценария завершился статусом" }),
        (error) => {
            assert.ok(error instanceof BackendApiClientError);
            assert.equal(error.message, "Запрос деталей сценария завершился статусом 404");
            assert.equal(error.failureKind, "terminal");
            assert.equal(error.retryable, false);
            return true;
        }
    );
});

test("backend api client sends json payload for post requests", async () => {
    const requests = [];
    const client = createBackendApiClient(
        async (url, options) => {
            requests.push({ url, options });
            return jsonResponse({ ok: true });
        },
        { resolveUrl }
    );

    const response = await client.postJson("/api/sessions", {
        scenarioSlug: "branch-safety",
        source: null
    });

    assert.deepEqual(response, { ok: true });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].options.method, "POST");
    assert.equal(requests[0].options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(String(requests[0].options.body)), {
        scenarioSlug: "branch-safety",
        source: null
    });
});

function jsonResponse(payload, { status = 200 } = {}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: new Headers({ "content-type": "application/json" }),
        async json() {
            return structuredClone(payload);
        }
    };
}

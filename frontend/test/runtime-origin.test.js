import test from "node:test";
import assert from "node:assert/strict";

import {
    resolveBackendApiUrl,
    resolveDefaultProviderName,
    resolveRuntimeProviderBootstrap
} from "../src/runtime-origin.js";

test("выбирает backend-api по умолчанию для http origin", () => {
    const bootstrap = resolveRuntimeProviderBootstrap({
        protocol: "http:",
        origin: "http://localhost:5173"
    });

    assert.deepEqual(bootstrap, {
        backendOrigin: "http://localhost:5173",
        defaultProviderName: "backend-api"
    });
    assert.equal(
        resolveDefaultProviderName({
            protocol: "http:",
            origin: "http://localhost:5173"
        }),
        "backend-api"
    );
});

test("возвращает local-fixture для file origin", () => {
    const bootstrap = resolveRuntimeProviderBootstrap({
        protocol: "file:",
        origin: "null"
    });

    assert.deepEqual(bootstrap, {
        backendOrigin: null,
        defaultProviderName: "local-fixture"
    });
});

test("возвращает local-fixture для пустого browser origin", () => {
    assert.equal(
        resolveDefaultProviderName({
            protocol: "",
            origin: ""
        }),
        "local-fixture"
    );
});

test("строит backend url только для поддержанного browser origin", () => {
    const url = resolveBackendApiUrl("/api/scenarios", {
        protocol: "https:",
        origin: "https://trainer.example"
    });

    assert.equal(url.toString(), "https://trainer.example/api/scenarios");
});

test("бросает понятную ошибку для неподдержанного origin", () => {
    assert.throws(
        () => resolveBackendApiUrl("/api/scenarios", {
            protocol: "file:",
            origin: "null"
        }),
        /Backend API недоступен/
    );
});

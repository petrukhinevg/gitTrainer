import test from "node:test";
import assert from "node:assert/strict";

import viteConfig, { resolveBackendDevOrigin } from "../vite.config.js";

test("использует backend origin по умолчанию для Vite proxy", () => {
    assert.equal(resolveBackendDevOrigin({}), "http://localhost:8083");
});

test("читает backend origin из окружения для Vite proxy", () => {
    assert.equal(
        resolveBackendDevOrigin({ BACKEND_DEV_ORIGIN: "http://localhost:8090" }),
        "http://localhost:8090"
    );
});

test("проксирует /api на backend origin", () => {
    assert.equal(viteConfig.server.proxy["/api"].target, "http://localhost:8083");
    assert.equal(viteConfig.server.proxy["/api"].changeOrigin, true);
});

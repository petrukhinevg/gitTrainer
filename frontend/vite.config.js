import { defineConfig } from "vite";

const DEFAULT_BACKEND_DEV_ORIGIN = "http://localhost:8083";

export function resolveBackendDevOrigin(env = process.env) {
    const candidate = String(env?.BACKEND_DEV_ORIGIN ?? "").trim();
    return candidate || DEFAULT_BACKEND_DEV_ORIGIN;
}

export default defineConfig({
    base: "/",
    server: {
        proxy: {
            "/api": {
                target: resolveBackendDevOrigin(),
                changeOrigin: true
            }
        },
        fs: {
            allow: [".."]
        }
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        cssCodeSplit: false,
        modulePreload: false,
        minify: false,
        rollupOptions: {
            output: {
                entryFileNames: "app.js",
                chunkFileNames: "app.js",
                assetFileNames: (assetInfo) => assetInfo.name === "style.css" ? "app.css" : "assets/[name][extname]"
            }
        }
    }
});

import { defineConfig } from "vite";

export default defineConfig({
    base: "/",
    server: {
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

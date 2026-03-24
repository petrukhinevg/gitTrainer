// Keep foundation and layout first, then layer feature-specific slices on top.
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/catalog.css";
import "./styles/lesson.css";
import "./styles/workspace.css";
import { createBackendApiCatalogProvider } from "./catalog/catalog-provider.js";
import { createBackendApiDetailProvider } from "./detail/detail-provider.js";
import { createBackendApiSessionProvider } from "./session/session-provider.js";
import { createBackendApiProgressProvider } from "./progress/progress-provider.js";
import { CATALOG_TAG_OPTIONS } from "./catalog/catalog-tag-options.js";
import { resolveDefaultProviderName } from "./runtime-origin.js";
import { createCatalogWorkspaceController } from "./workspace-shell/controller.js";

const catalogProviderFactories = Object.freeze({
    "backend-api": () => createBackendApiCatalogProvider()
});

const detailProviderFactories = Object.freeze({
    "backend-api": () => createBackendApiDetailProvider()
});

const sessionProviderFactories = Object.freeze({
    "backend-api": () => createBackendApiSessionProvider()
});

const progressProviderFactories = Object.freeze({
    "backend-api": () => createBackendApiProgressProvider()
});

const appRoot = document.querySelector("#app");

createCatalogWorkspaceController({
    appRoot,
    defaultProviderName: resolveDefaultProviderName(),
    catalogProviderFactories,
    detailProviderFactories,
    sessionProviderFactories,
    progressProviderFactories,
    tagOptions: CATALOG_TAG_OPTIONS
}).bootstrap();

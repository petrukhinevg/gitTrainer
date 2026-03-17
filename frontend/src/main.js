// Keep foundation and layout first, then layer feature-specific slices on top.
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/catalog.css";
import "./styles/lesson.css";
import "./styles/workspace.css";
import {
    createBackendApiCatalogProvider,
    createLocalFixtureCatalogProvider,
    createUnavailableFixtureCatalogProvider
} from "./catalog/catalog-provider.js";
import {
    createBackendApiDetailProvider,
    createLocalFixtureDetailProvider,
    createUnavailableFixtureDetailProvider
} from "./detail/detail-provider.js";
import {
    createBackendApiSessionProvider,
    createLocalFixtureSessionProvider,
    createUnavailableFixtureSessionProvider
} from "./session/session-provider.js";
import {
    createBackendApiProgressProvider,
    createLocalFixtureProgressProvider,
    createUnavailableFixtureProgressProvider
} from "./progress/progress-provider.js";
import { CATALOG_TAG_OPTIONS } from "./catalog/catalog-fixtures.js";
import { createCatalogWorkspaceController } from "./workspace-shell/controller.js";

const catalogProviderFactories = Object.freeze({
    "local-fixture": () => createLocalFixtureCatalogProvider(),
    "backend-api": () => createBackendApiCatalogProvider(),
    "fixture-unavailable": () => createUnavailableFixtureCatalogProvider()
});

const detailProviderFactories = Object.freeze({
    "local-fixture": () => createLocalFixtureDetailProvider(),
    "backend-api": () => createBackendApiDetailProvider(),
    "fixture-unavailable": () => createUnavailableFixtureDetailProvider()
});

const sessionProviderFactories = Object.freeze({
    "local-fixture": () => createLocalFixtureSessionProvider(),
    "backend-api": () => createBackendApiSessionProvider(),
    "fixture-unavailable": () => createUnavailableFixtureSessionProvider()
});

const progressProviderFactories = Object.freeze({
    "local-fixture": () => createLocalFixtureProgressProvider(),
    "backend-api": () => createBackendApiProgressProvider(),
    "fixture-unavailable": () => createUnavailableFixtureProgressProvider()
});

const appRoot = document.querySelector("#app");

createCatalogWorkspaceController({
    appRoot,
    catalogProviderFactories,
    detailProviderFactories,
    sessionProviderFactories,
    progressProviderFactories,
    tagOptions: CATALOG_TAG_OPTIONS
}).bootstrap();

import "./styles.css";
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

const appRoot = document.querySelector("#app");

createCatalogWorkspaceController({
    appRoot,
    catalogProviderFactories,
    detailProviderFactories,
    tagOptions: CATALOG_TAG_OPTIONS
}).bootstrap();

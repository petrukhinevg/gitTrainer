import "./styles.css";
import {
    createBackendApiCatalogProvider,
    createLocalFixtureCatalogProvider,
    createUnavailableFixtureCatalogProvider
} from "./catalog/catalog-provider.js";
import { CATALOG_TAG_OPTIONS } from "./catalog/catalog-fixtures.js";
import { createCatalogWorkspaceController } from "./workspace-shell/controller.js";

const providerFactories = Object.freeze({
    "local-fixture": () => createLocalFixtureCatalogProvider(),
    "backend-api": () => createBackendApiCatalogProvider(),
    "fixture-unavailable": () => createUnavailableFixtureCatalogProvider()
});

const appRoot = document.querySelector("#app");

createCatalogWorkspaceController({
    appRoot,
    providerFactories,
    tagOptions: CATALOG_TAG_OPTIONS
}).bootstrap();

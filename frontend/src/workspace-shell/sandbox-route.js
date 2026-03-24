export const SANDBOX_ROUTE_HASH = "#/sandbox";
export const SANDBOX_SCENARIO_SLUG = "merge-sandbox-outline";

export function isSandboxScenarioSlug(slug) {
    return slug === SANDBOX_SCENARIO_SLUG;
}

export function isSandboxShortcutActive(state) {
    return state.route === "exercise" && isSandboxScenarioSlug(state.selectedScenarioSlug);
}

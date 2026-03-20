export function shouldResetLessonScrollForRouteChange({
    previousRoute,
    previousScenarioSlug,
    previousSelectedFocus,
    nextRoute,
    nextScenarioSlug,
    nextSelectedFocus
}) {
    return previousRoute !== nextRoute
        || previousScenarioSlug !== nextScenarioSlug
        || previousSelectedFocus !== nextSelectedFocus;
}

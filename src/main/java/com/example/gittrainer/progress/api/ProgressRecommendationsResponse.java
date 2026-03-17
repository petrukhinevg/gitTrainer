package com.example.gittrainer.progress.api;

import java.util.List;

public record ProgressRecommendationsResponse(
        List<RecommendationScenarioResponse> solved,
        List<RecommendationScenarioResponse> attempted,
        RecommendationScenarioResponse next,
        String rationale
) {
}
